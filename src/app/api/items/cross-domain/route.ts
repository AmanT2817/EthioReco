// GET /api/items/cross-domain?itemId=...
// The killer feature — returns items from OTHER domains based on this item's metadata
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapCrossDomain } from "@/rec_engine/cross_domain";
import { contentBasedSimilar } from "@/rec_engine/content_based";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "itemId required" } },
      { status: 400 },
    );
  }
  const seed = await db.item.findUnique({
    where: { id: itemId },
    select: { id: true, type: true, genre: true, title: true },
  });
  if (!seed) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Item not found" } },
      { status: 404 },
    );
  }

  // Get other domains (not the seed's domain)
  const otherDomains = (["book", "movie", "music"] as const).filter((d) => d !== seed.type);

  const results: Array<{
    item: Awaited<ReturnType<typeof db.item.findFirst>>;
    seedGenre: string;
    sourceDomain: string;
  }> = [];

  if (seed.genre) {
    // Use cross-domain mapping
    for (const targetDomain of otherDomains) {
      if (targetDomain === "book") {
        // Skip — books don't appear as a typical cross-domain target here
        // (we focus on movies/music for cross-domain surfacing)
        continue;
      }
      const sourceGenres = seed.genre.toLowerCase().split(/[\/,|]/).map((s) => s.trim());
      for (const sourceGenre of sourceGenres) {
        const mappedGenres = mapCrossDomain(sourceGenre, targetDomain as "movie" | "music");
        if (mappedGenres.length === 0) continue;
        const candidate = await db.item.findFirst({
          where: {
            status: "active",
            type: targetDomain,
            id: { not: itemId },
          },
          include: { ethiopianMetadata: true },
        });
        // Filter to ensure genre overlap
        const matching = candidate && candidate.genre
          ? mappedGenres.some((mg) =>
              candidate.genre!.toLowerCase().includes(mg.toLowerCase()),
            )
          : false;
        if (matching) {
          results.push({ item: candidate, seedGenre: sourceGenre, sourceDomain: seed.type });
        }
      }
    }
  }

  // Fallback: content-based similar items across other domains
  if (results.length === 0) {
    const similar = await contentBasedSimilar(itemId, 8, [itemId]);
    for (const s of similar) {
      const it = await db.item.findUnique({
        where: { id: s.itemId },
        include: { ethiopianMetadata: true },
      });
      if (it && it.type !== seed.type) {
        results.push({
          item: it,
          seedGenre: seed.genre ?? "your taste",
          sourceDomain: seed.type,
        });
      }
      if (results.length >= 3) break;
    }
  }

  return NextResponse.json({
    data: results.slice(0, 4).map((r) => ({
      ...r.item,
      crossDomain: true,
      crossDomainSource: r.sourceDomain,
      crossDomainSeedGenre: r.seedGenre,
    })),
    meta: { seedItemId: itemId, seedType: seed.type },
    errors: [],
  });
}
