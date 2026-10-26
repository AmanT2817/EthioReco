// GET  /api/admin/import?source=tmdb|spotify|google_books&q=...
// POST /api/admin/import — insert a single imported item into the catalog
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { recomputeAllItemVectors } from "@/rec_engine/content_based";
import { searchExternal, externalStatus, type ExternalType } from "@/lib/external";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const url = new URL(req.url);
  const source = url.searchParams.get("source") as ExternalType | null;
  const q = url.searchParams.get("q") ?? "";
  if (!source || !q) {
    return NextResponse.json({
      data: { results: [], status: externalStatus() },
      meta: {},
      errors: [],
    });
  }
  const results = await searchExternal(source, q);
  return NextResponse.json({
    data: { results, status: externalStatus() },
    meta: { source, q, count: results.length },
    errors: [],
  });
}

const INSERT_KEYS_BY_TYPE: Record<ExternalType, string[]> = {
  movie: ["title", "description", "releaseYear", "language", "country", "coverImageUrl", "director", "genre", "externalId", "externalSource", "averageRating", "ratingCount"],
  music: ["title", "description", "releaseYear", "language", "country", "coverImageUrl", "artist", "album", "durationSec", "trackNumber", "genre", "externalId", "externalSource", "averageRating", "ratingCount"],
  book: ["title", "description", "releaseYear", "language", "country", "coverImageUrl", "author", "isbn", "pages", "publisher", "genre", "externalId", "externalSource", "averageRating", "ratingCount"],
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const body = await req.json();
  const { type, ...fields } = body;
  if (!type || !["book", "movie", "music"].includes(type)) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Invalid type" } },
      { status: 400 },
    );
  }
  // Allow only allowlisted fields
  const allow = INSERT_KEYS_BY_TYPE[type as ExternalType];
  const clean: Record<string, unknown> = { type };
  for (const k of allow) {
    if (fields[k] !== undefined && fields[k] !== null && fields[k] !== "") {
      clean[k] = fields[k];
    } else {
      clean[k] = null;
    }
  }
  // Check for existing item with same external source+id
  if (clean.externalId && clean.externalSource) {
    const existing = await db.item.findFirst({
      where: { externalId: String(clean.externalId), externalSource: String(clean.externalSource) },
    });
    if (existing) {
      return NextResponse.json(
        { error: { code: "DUPLICATE", message: "Item already imported" } },
        { status: 409 },
      );
    }
  }
  const item = await db.item.create({
    data: {
      title: String(clean.title),
      type: clean.type as "book" | "movie" | "music",
      description: String(clean.description ?? ""),
      releaseYear: clean.releaseYear as number | null,
      language: clean.language as string | null,
      country: clean.country as string | null,
      coverImageUrl: clean.coverImageUrl as string | null,
      externalId: clean.externalId ? String(clean.externalId) : null,
      externalSource: clean.externalSource ? String(clean.externalSource) : null,
      averageRating: (clean.averageRating as number) ?? 0,
      ratingCount: (clean.ratingCount as number) ?? 0,
      author: clean.author as string | null,
      director: clean.director as string | null,
      artist: clean.artist as string | null,
      album: clean.album as string | null,
      genre: (clean.genre as string) ?? null,
    },
  });
  // Recompute vectors in background
  void recomputeAllItemVectors();
  // Audit log
  await db.adminLog.create({
    data: { adminId: user.id, action: "import_external", targetType: "item", targetId: item.id },
  });
  return NextResponse.json(
    { data: { item }, meta: { message: "Imported — vectors recomputed" }, errors: [] },
    { status: 201 },
  );
}
