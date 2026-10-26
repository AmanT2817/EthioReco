// GET /api/items — list with filters (?type, ?genre, ?origin, ?q)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // book|movie|music
  const genre = url.searchParams.get("genre");
  const origin = url.searchParams.get("origin"); // ethiopian|international
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const where: Record<string, unknown> = { status: "active" };
  if (type) where.type = type;
  if (genre) where.genre = { contains: genre };

  let items;
  if (origin === "ethiopian") {
    items = await db.item.findMany({
      where: { ...where, ethiopianMetadata: { is: { not: null } } },
      include: { ethiopianMetadata: true },
      orderBy: { averageRating: "desc" },
      take: limit,
      skip: offset,
    });
  } else if (origin === "international") {
    items = await db.item.findMany({
      where: { ...where, ethiopianMetadata: { is: null } },
      orderBy: { averageRating: "desc" },
      take: limit,
      skip: offset,
    });
  } else {
    items = await db.item.findMany({
      where,
      include: { ethiopianMetadata: true },
      orderBy: { averageRating: "desc" },
      take: limit,
      skip: offset,
    });
  }

  return NextResponse.json({
    data: items,
    meta: { count: items.length, offset },
    errors: [],
  });
}
