// GET /api/items/search?q=...
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ data: [], meta: { q: "" }, errors: [] });
  }
  // Simple ILIKE search across title/author/artist/director/genre
  // (SQLite uses LIKE — case-insensitive by default for ASCII)
  const items = await db.item.findMany({
    where: {
      status: "active",
      OR: [
        { title: { contains: q } },
        { author: { contains: q } },
        { artist: { contains: q } },
        { director: { contains: q } },
        { genre: { contains: q } },
        { description: { contains: q } },
      ],
    },
    include: { ethiopianMetadata: true },
    take: 30,
    orderBy: { averageRating: "desc" },
  });
  return NextResponse.json({ data: items, meta: { q, count: items.length }, errors: [] });
}
