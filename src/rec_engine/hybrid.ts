// EthioReco — Recommendation Orchestrator
// Blends content-based + collaborative (50/50 per spec),
// applies cultural boost, generates explanations,
// caches results with TTL.

import { db } from "@/lib/db";
import { contentScoreForUser } from "./content_based";
import { collaborativeScoreForUser, collaborativeRecommendations } from "./collaborative";
import { applyCulturalBoost } from "./cultural_boost";
import { coldStartRecommendations } from "./cold_start";
import { generateExplanation, type ExplanationKind } from "./explanation";
import { mapCrossDomain } from "./cross_domain";
import { scanWishlistForMatches } from "./notify_match";

export interface ScoredRec {
  itemId: string;
  finalScore: number;
  algorithm: ExplanationKind;
  explanation: string;
  crossDomain: boolean;
  ethiopianBoostApplied: boolean;
}

const REC_TTL_HOURS = 24;
const MAX_RECS = 12;
const MIN_RATINGS_FOR_HYBRID = 5;

// Main entrypoint — calibrates user's taste (cinematic naming per spec)
export async function calibrateUserTaste(userId: string): Promise<ScoredRec[]> {
  // Invalidate any existing cached recs first
  await db.recommendation.deleteMany({ where: { userId } });

  const ratingCount = await db.rating.count({
    where: { userId, notInterested: false },
  });

  const isColdStart = ratingCount < MIN_RATINGS_FOR_HYBRID;
  let recs: ScoredRec[];

  if (isColdStart) {
    recs = await buildColdStartRecs(userId);
  } else {
    recs = await buildHybridRecs(userId);
  }

  // Append cross-domain recs (the killer feature — surfaces always)
  const crossDomain = await buildCrossDomainRecs(userId);
  recs = [...recs, ...crossDomain];

  // Cap to MAX_RECS, but keep cross-domain visible (per spec)
  const finalRecs = recs.slice(0, MAX_RECS);

  // Persist with rank + TTL
  const now = new Date();
  const expires = new Date(now.getTime() + REC_TTL_HOURS * 60 * 60 * 1000);
  for (let i = 0; i < finalRecs.length; i++) {
    const r = finalRecs[i];
    await db.recommendation.create({
      data: {
        userId,
        itemId: r.itemId,
        score: r.finalScore,
        rank: i + 1,
        algorithm: r.algorithm,
        explanation: r.explanation,
        crossDomain: r.crossDomain,
        ethiopianBoostApplied: r.ethiopianBoostApplied,
        expiresAt: expires,
      },
    });
  }

  // After calibration, scan wishlist for cross-domain matches (non-blocking)
  // Per spec: "Notify when matched" — surfaces a notification when a strong
  // cross-domain match is found for an item the user has wishlisted.
  void scanWishlistForMatches(userId).catch((err) => {
    console.error("[notify_match] scan failed:", err);
  });

  return finalRecs;
}

// Hybrid scoring — 50/50 blend per spec
async function buildHybridRecs(userId: string): Promise<ScoredRec[]> {
  // Get all unrated items the user might like
  const myRatedItemIds = new Set(
    (
      await db.rating.findMany({
        where: { userId },
        select: { itemId: true },
      })
    ).map((r) => r.itemId),
  );

  // Use collaborative as the candidate source (highest-signal items from neighbors)
  const collabCandidates = await collaborativeRecommendations(userId, 30);
  if (collabCandidates.length === 0) {
    // Fallback: popular items the user hasn't rated
    return buildPopularFallback(userId, myRatedItemIds);
  }

  // For each candidate, also compute content score; blend 50/50
  const seed = await db.rating.findFirst({
    where: { userId, score: { gte: 4 }, notInterested: false },
    orderBy: { score: "desc" },
    select: { itemId: true, score: true },
  });
  const seedItem = seed
    ? await db.item.findUnique({ where: { id: seed.itemId }, select: { title: true } })
    : null;

  const out: ScoredRec[] = [];
  for (const c of collabCandidates) {
    if (myRatedItemIds.has(c.itemId)) continue;
    const content = await contentScoreForUser(userId, c.itemId);
    // 50/50 hybrid blend per spec
    let blended = 0.5 * content.score + 0.5 * c.score;
    // If one signal is missing (score=0), use the other alone (per spec)
    if (content.score === 0 && c.score > 0) blended = c.score;
    else if (c.score === 0 && content.score > 0) blended = content.score;

    if (blended <= 0) continue;

    const { boostedScore, applied } = await applyCulturalBoost(userId, c.itemId, blended);
    const algo: ExplanationKind = applied
      ? "cultural"
      : content.score > 0 && c.score > 0
        ? "hybrid"
        : c.score > 0
          ? "collab"
          : "content";

    out.push({
      itemId: c.itemId,
      finalScore: boostedScore,
      algorithm: algo,
      explanation: generateExplanation({
        kind: algo,
        seedItemTitle: seedItem?.title,
        seedItemScore: seed?.score,
      }),
      crossDomain: false,
      ethiopianBoostApplied: applied,
    });
  }

  out.sort((a, b) => b.finalScore - a.finalScore);
  return out.slice(0, MAX_RECS - 3); // leave room for cross-domain
}

// Cold start — onboarding preferences drive initial recs.
// If user has no preferences either, fall back to popular items (so the dashboard
// is never empty — always show something to rate).
async function buildColdStartRecs(userId: string): Promise<ScoredRec[]> {
  const cold = await coldStartRecommendations(userId, MAX_RECS - 3);
  if (cold.length > 0) {
    return cold.map((c) => ({
      itemId: c.itemId,
      finalScore: c.score,
      algorithm: "cold_start" as ExplanationKind,
      explanation: c.explanation,
      crossDomain: false,
      ethiopianBoostApplied: c.explanation.includes("Ethiopian"),
    }));
  }
  // No preferences either — fall back to popular items so the dashboard
  // shows SOMETHING for the user to rate (this is what gets the engine going).
  const myRatedItemIds = new Set<string>(
    (await db.rating.findMany({
      where: { userId },
      select: { itemId: true },
    })).map((r) => r.itemId),
  );
  return buildPopularFallback(userId, myRatedItemIds);
}

// Popular fallback for users with no neighbor overlap
async function buildPopularFallback(
  userId: string,
  excludeIds: Set<string>,
): Promise<ScoredRec[]> {
  const popular = await db.item.findMany({
    where: { status: "active", id: { notIn: Array.from(excludeIds) } },
    orderBy: [{ averageRating: "desc" }, { ratingCount: "desc" }],
    take: MAX_RECS - 3,
    select: { id: true },
  });
  return popular.map((p) => ({
    itemId: p.id,
    finalScore: 0.5,
    algorithm: "popular" as ExplanationKind,
    explanation: generateExplanation({ kind: "popular" }),
    crossDomain: false,
    ethiopianBoostApplied: false,
  }));
}

// Cross-domain: surface items from OTHER domains based on user's strong domain A preference
export async function buildCrossDomainRecsFromUserId(userId: string): Promise<ScoredRec[]> {
  return buildCrossDomainRecs(userId);
}

// Cross-domain: surface items from OTHER domains based on user's strong domain A preference
async function buildCrossDomainRecs(userId: string): Promise<ScoredRec[]> {
  // Find the user's strongest-rated domain
  const ratings = await db.rating.findMany({
    where: { userId, score: { gte: 4 }, notInterested: false },
    select: { itemId: true, score: true },
  });
  if (ratings.length === 0) return [];

  const items = await db.item.findMany({
    where: { id: { in: ratings.map((r) => r.itemId) } },
    select: { id: true, type: true, genre: true, title: true },
  });
  const byId = new Map(items.map((i) => [i.id, i]));

  // Tally genre frequency by source domain
  const genreScore = new Map<string, { domain: string; score: number }>();
  for (const r of ratings) {
    const it = byId.get(r.itemId);
    if (!it?.genre) continue;
    for (const g of it.genre.split(/[\/,|]/).map((s) => s.trim().toLowerCase())) {
      const key = `${it.type}::${g}`;
      const prev = genreScore.get(key) ?? { domain: it.type, score: 0 };
      prev.score += r.score;
      genreScore.set(key, prev);
    }
  }

  // Sort to find top cross-domain candidates
  const sortedGenres = Array.from(genreScore.entries()).sort(
    (a, b) => b[1].score - a[1].score,
  );

  const alreadyRated = new Set(ratings.map((r) => r.itemId));
  const crossRecs: ScoredRec[] = [];
  const seenItemIds = new Set<string>();
  const TARGET_CROSS_RECS = 3;

  for (const [genreKey, info] of sortedGenres) {
    if (crossRecs.length >= TARGET_CROSS_RECS) break;
    const sourceGenre = genreKey.split("::")[1];
    // Pick target domains (the OTHER two)
    const otherDomains: ("movie" | "music" | "book")[] = (
      ["book", "movie", "music"] as const
    ).filter((d) => d !== info.domain) as ("book" | "music" | "movie")[];

    for (const targetDomain of otherDomains) {
      if (crossRecs.length >= TARGET_CROSS_RECS) break;
      const targetGenres = mapCrossDomain(sourceGenre, targetDomain as "movie" | "music");
      if (targetGenres.length === 0 && targetDomain === "book") {
        // books don't accept cross-domain mapping reverse — skip
        continue;
      }
      // Find items in target domain matching mapped genres
      const candidates = await db.item.findMany({
        where: {
          status: "active",
          type: targetDomain,
          id: { notIn: Array.from(alreadyRated) },
        },
        select: {
          id: true,
          genre: true,
          title: true,
          ethiopianMetadata: true,
        },
      });
      // Match if any mapped genre overlaps with item genre
      const matched = candidates
        .filter((c) => {
          if (!c.genre) return false;
          const itemGenres = c.genre.toLowerCase().split(/[\/,|]/).map((s) => s.trim());
          return targetGenres.some((tg) =>
            itemGenres.some((ig) => ig.includes(tg.toLowerCase()) || tg.toLowerCase().includes(ig)),
          );
        })
        .slice(0, 1); // one per genre to keep diversity

      for (const m of matched) {
        if (seenItemIds.has(m.id)) continue;
        seenItemIds.add(m.id);
        // Get seed item title for explanation
        const seedItem = byId.get(ratings[0].itemId);
        crossRecs.push({
          itemId: m.id,
          finalScore: 0.7,
          algorithm: "cross_domain",
          explanation: generateExplanation({
            kind: "cross_domain",
            sourceDomain: info.domain,
            seedItemTitle: seedItem?.title,
          }),
          crossDomain: true,
          ethiopianBoostApplied: m.ethiopianMetadata?.isTraditional ?? false,
        });
        if (crossRecs.length >= TARGET_CROSS_RECS) break;
      }
    }
  }

  return crossRecs;
}

// Retrieve cached recommendations (used on dashboard load — does NOT recompute per spec)
export async function getCalibratedRecs(userId: string): Promise<ScoredRec[]> {
  const now = new Date();
  const cached = await db.recommendation.findMany({
    where: { userId, expiresAt: { gt: now } },
    orderBy: { rank: "asc" },
    include: { item: true },
  });
  if (cached.length === 0) return [];
  return cached.map((c) => ({
    itemId: c.itemId,
    finalScore: c.score,
    algorithm: c.algorithm as ExplanationKind,
    explanation: c.explanation ?? "Recommended for you",
    crossDomain: c.crossDomain,
    ethiopianBoostApplied: c.ethiopianBoostApplied,
  }));
}
