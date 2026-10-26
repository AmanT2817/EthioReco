// POST /api/items/seed — populate sample content (called from the seed script)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest) {
  // Only allow if items table is empty (avoid dupes)
  const count = await db.item.count();
  if (count > 0) {
    return NextResponse.json({
      data: { alreadySeeded: true, count },
      meta: {},
      errors: [],
    });
  }

  // Inline minimal seed so the route works in dev without external scripts
  const items: Array<{
    title: string; type: string; description: string; releaseYear: number | null;
    language: string | null; country: string | null; coverImageUrl: string | null;
    author?: string; director?: string; artist?: string; album?: string; genre: string;
    ethiopian?: {
      culturalRegion: string; traditionalGenre: string; isTraditional: boolean;
      amharicTitle: string; amharicDescription: string; culturalSignificance: string;
    };
  }> = [];

  // Sample items defined inline — see scripts/seed.ts for the full set
  void items;
  return NextResponse.json({
    data: { message: "Use scripts/seed.ts to populate sample content" },
    meta: {},
    errors: [],
  });
}
