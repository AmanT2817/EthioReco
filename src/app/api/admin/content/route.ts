// GET /api/admin/content — list all items (admin-only)
// POST /api/admin/content — add new item (with Ethiopian flag toggle)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";
import { recomputeAllItemVectors } from "@/rec_engine/content_based";
import { z } from "zod";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const items = await db.item.findMany({
    include: { ethiopianMetadata: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: items, meta: { count: items.length }, errors: [] });
}

const AddContentSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(["book", "movie", "music"]),
  description: z.string().max(2000).optional().default(""),
  releaseYear: z.number().int().optional(),
  language: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  genre: z.string().max(100).optional(),
  // type-specific
  author: z.string().optional(), // book
  director: z.string().optional(), // movie
  artist: z.string().optional(), // music
  album: z.string().optional(), // music
  // Ethiopian flag toggle
  ethiopian: z
    .object({
      culturalRegion: z.string().optional(),
      traditionalGenre: z.string().optional(),
      isTraditional: z.boolean().default(false),
      amharicTitle: z.string().optional(),
      amharicDescription: z.string().optional(),
      culturalSignificance: z.string().optional(),
      featuredPriority: z.number().int().default(0),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const body = await req.json();
  const parsed = AddContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0].message } },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const item = await db.item.create({
    data: {
      title: d.title,
      type: d.type,
      description: d.description ?? "",
      releaseYear: d.releaseYear ?? null,
      language: d.language ?? null,
      country: d.country ?? null,
      coverImageUrl: d.coverImageUrl || null,
      genre: d.genre ?? null,
      author: d.author ?? null,
      director: d.director ?? null,
      artist: d.artist ?? null,
      album: d.album ?? null,
    },
  });
  if (d.ethiopian) {
    await db.ethiopianMetadata.create({
      data: {
        itemId: item.id,
        culturalRegion: d.ethiopian.culturalRegion ?? null,
        traditionalGenre: d.ethiopian.traditionalGenre ?? null,
        isTraditional: d.ethiopian.isTraditional,
        amharicTitle: d.ethiopian.amharicTitle ?? null,
        amharicDescription: d.ethiopian.amharicDescription ?? null,
        culturalSignificance: d.ethiopian.culturalSignificance ?? null,
        featuredPriority: d.ethiopian.featuredPriority,
        curatedBy: admin.email,
      },
    });
  }
  // Refit vectors so the new item is searchable
  void recomputeAllItemVectors();

  await db.adminLog.create({
    data: { adminId: admin.id, action: "add_content", targetType: "item", targetId: item.id },
  });

  return NextResponse.json(
    { data: { item }, meta: { message: "Content added — vectors recomputed" }, errors: [] },
    { status: 201 },
  );
}
