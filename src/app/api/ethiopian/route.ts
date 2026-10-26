// GET /api/ethiopian — Ethiopian content landing data
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filter = url.searchParams.get("type"); // amharic-literature | film | music
  const featuredOnly = url.searchParams.get("featured") === "true";

  const where = { item: { status: "active" as const } };
  let metadata;
  if (filter === "amharic-literature") {
    metadata = await db.ethiopianMetadata.findMany({
      where: { ...where, item: { type: "book", status: "active" } },
      include: { item: true },
      orderBy: { featuredPriority: "desc" },
    });
  } else if (filter === "film") {
    metadata = await db.ethiopianMetadata.findMany({
      where: { ...where, item: { type: "movie", status: "active" } },
      include: { item: true },
      orderBy: { featuredPriority: "desc" },
    });
  } else if (filter === "music") {
    metadata = await db.ethiopianMetadata.findMany({
      where: { ...where, item: { type: "music", status: "active" } },
      include: { item: true },
      orderBy: { featuredPriority: "desc" },
    });
  } else if (featuredOnly) {
    metadata = await db.ethiopianMetadata.findMany({
      where: { ...where, featuredPriority: { gte: 5 } },
      include: { item: true },
      orderBy: { featuredPriority: "desc" },
      take: 10,
    });
  } else {
    metadata = await db.ethiopianMetadata.findMany({
      where: { ...where, featuredPriority: { gte: 1 } },
      include: { item: true },
      orderBy: { featuredPriority: "desc" },
    });
  }

  return NextResponse.json({ data: metadata, meta: { count: metadata.length }, errors: [] });
}
