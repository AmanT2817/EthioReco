// EthioReco — User-User Collaborative Filtering
// Score items by aggregate ratings of top-K nearest neighbors.

import { db } from "@/lib/db";

interface Neighbor {
  userId: string;
  similarity: number;
}

// Compute user-user cosine similarity from shared ratings
async function findNeighbors(userId: string, k = 20): Promise<Neighbor[]> {
  const myRatings = await db.rating.findMany({
    where: { userId, notInterested: false },
    select: { itemId: true, score: true },
  });
  if (myRatings.length === 0) return [];

  const myMap = new Map(myRatings.map((r) => [r.itemId, r.score]));

  // Find candidate users who rated overlapping items
  const itemIds = Array.from(myMap.keys());
  const otherRatings = await db.rating.findMany({
    where: { itemId: { in: itemIds }, userId: { not: userId }, notInterested: false },
    select: { userId: true, itemId: true, score: true },
  });

  // Group by user
  const byUser = new Map<string, Map<string, number>>();
  for (const r of otherRatings) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, new Map());
    byUser.get(r.userId)!.set(r.itemId, r.score);
  }

  // Cosine similarity — centered (subtract mean) to handle grading bias
  const myMean = myRatings.reduce((s, r) => s + r.score, 0) / myRatings.length;
  const myCentered = new Map<string, number>();
  for (const [itemId, score] of myMap) myCentered.set(itemId, score - myMean);

  let myNorm = 0;
  for (const v of myCentered.values()) myNorm += v * v;
  myNorm = Math.sqrt(myNorm) || 1;

  const neighbors: Neighbor[] = [];
  for (const [otherUserId, theirMap] of byUser) {
    if (theirMap.size < 2) continue; // require >=2 shared ratings
    const theirMean =
      Array.from(theirMap.values()).reduce((s, v) => s + v, 0) / theirMap.size;
    let dot = 0;
    let theirNorm = 0;
    for (const [itemId, score] of theirMap) {
      const myVal = myCentered.get(itemId);
      if (myVal === undefined) continue;
      const theirVal = score - theirMean;
      dot += myVal * theirVal;
      theirNorm += theirVal * theirVal;
    }
    theirNorm = Math.sqrt(theirNorm) || 1;
    const sim = dot / (myNorm * theirNorm);
    if (sim > 0) neighbors.push({ userId: otherUserId, similarity: sim });
  }

  neighbors.sort((a, b) => b.similarity - a.similarity);
  return neighbors.slice(0, k);
}

// Score candidate items using neighbor ratings
export async function collaborativeScoreForUser(
  userId: string,
  candidateItemId: string,
): Promise<{ score: number; signal: "collab" }> {
  const neighbors = await findNeighbors(userId);
  if (neighbors.length === 0) return { score: 0, signal: "collab" };

  const neighborIds = neighbors.map((n) => n.userId);
  const ratings = await db.rating.findMany({
    where: { userId: { in: neighborIds }, itemId: candidateItemId, notInterested: false },
    select: { userId: true, score: true },
  });
  if (ratings.length === 0) return { score: 0, signal: "collab" };

  const simByUser = new Map(neighbors.map((n) => [n.userId, n.similarity]));
  let weighted = 0;
  let totalSim = 0;
  for (const r of ratings) {
    const sim = simByUser.get(r.userId) ?? 0;
    weighted += sim * r.score;
    totalSim += sim;
  }
  if (totalSim === 0) return { score: 0, signal: "collab" };
  // Normalize score 0-5 to 0-1
  const raw = weighted / totalSim / 5;
  return { score: Math.max(0, Math.min(1, raw)), signal: "collab" };
}

// Get top collaborative-filtered candidates the user hasn't rated yet
export async function collaborativeRecommendations(
  userId: string,
  limit = 10,
  excludeItemIds: string[] = [],
): Promise<{ itemId: string; score: number }[]> {
  const neighbors = await findNeighbors(userId);
  if (neighbors.length === 0) return [];

  const neighborIds = neighbors.map((n) => n.userId);
  const simByUser = new Map(neighbors.map((n) => [n.userId, n.similarity]));

  // Items the user has already rated (to exclude)
  const myItemIds = new Set<string>(
    (await db.rating.findMany({ where: { userId }, select: { itemId: true } })).map(
      (r) => r.itemId,
    ),
  );
  excludeItemIds.forEach((id) => myItemIds.add(id));

  // All neighbor ratings, excluding items user already rated
  const candidateRatings = await db.rating.findMany({
    where: {
      userId: { in: neighborIds },
      notInterested: false,
      itemId: { notIn: Array.from(myItemIds) },
    },
    select: { userId: true, itemId: true, score: true },
  });

  const agg = new Map<string, { weighted: number; totalSim: number }>();
  for (const r of candidateRatings) {
    const sim = simByUser.get(r.userId) ?? 0;
    const entry = agg.get(r.itemId) ?? { weighted: 0, totalSim: 0 };
    entry.weighted += sim * r.score;
    entry.totalSim += sim;
    agg.set(r.itemId, entry);
  }

  const scored = Array.from(agg.entries())
    .map(([itemId, { weighted, totalSim }]) => ({
      itemId,
      score: totalSim > 0 ? Math.max(0, Math.min(1, weighted / totalSim / 5)) : 0,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
