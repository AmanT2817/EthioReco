// EthioReco — Content-Based Filtering
// TF-IDF + cosine similarity. Vectors cached in DB (item_vectors table).

import { db } from "@/lib/db";
import {
  buildFeatureText,
  fitVectorizer,
  transformVector,
  cosineSimilarity,
  serializeVector,
  deserializeVector,
  type FittedVectorizer,
} from "./vectorizer";

// In-memory cache of the fitted vectorizer (rebuilt on demand)
let fittedCache: { vectorizer: FittedVectorizer; builtAt: number } | null = null;
const FIT_TTL_MS = 5 * 60 * 1000; // 5 min

async function getFittedVectorizer(): Promise<FittedVectorizer> {
  const now = Date.now();
  if (fittedCache && now - fittedCache.builtAt < FIT_TTL_MS) {
    return fittedCache.vectorizer;
  }
  const items = await db.item.findMany({
    where: { status: "active" },
    select: { id: true, title: true, type: true, genre: true, description: true },
  });
  const corpus = items.map((it) =>
    buildFeatureText({ type: it.type, genre: it.genre, title: it.title, description: it.description }),
  );
  const vectorizer = fitVectorizer(corpus);
  fittedCache = { vectorizer, builtAt: now };
  return vectorizer;
}

// Recompute + persist all item vectors (called on item add/update, or manually)
export async function recomputeAllItemVectors(): Promise<number> {
  const vectorizer = await getFittedVectorizer();
  const items = await db.item.findMany({
    where: { status: "active" },
    select: { id: true, title: true, type: true, genre: true, description: true },
  });
  let count = 0;
  for (const it of items) {
    const featureText = buildFeatureText({
      type: it.type,
      genre: it.genre,
      title: it.title,
      description: it.description,
    });
    const vec = transformVector(featureText, vectorizer);
    await db.itemVector.upsert({
      where: { itemId: it.id },
      create: {
        itemId: it.id,
        embedding: serializeVector(vec),
        featureText,
      },
      update: {
        embedding: serializeVector(vec),
        featureText,
        vectorizedAt: new Date(),
      },
    });
    count++;
  }
  // Invalidate the in-memory cache so subsequent reads use fresh state
  fittedCache = null;
  return count;
}

// Ensure vectors exist (lazy build on first request if missing)
async function ensureVectors(): Promise<void> {
  const totalItems = await db.item.count({ where: { status: "active" } });
  const totalVectors = await db.itemVector.count();
  if (totalVectors < totalItems) {
    await recomputeAllItemVectors();
  }
}

// Find top-K content-similar items to a seed item
export async function contentBasedSimilar(
  seedItemId: string,
  k = 10,
  excludeIds: string[] = [],
): Promise<{ itemId: string; similarity: number }[]> {
  await ensureVectors();
  const seed = await db.itemVector.findUnique({ where: { itemId: seedItemId } });
  if (!seed) return [];
  const seedVec = deserializeVector(seed.embedding);

  const all = await db.itemVector.findMany({
    where: { itemId: { not: seedItemId, notIn: excludeIds } },
    select: { itemId: true, embedding: true },
  });

  const scored = all.map((row) => ({
    itemId: row.itemId,
    similarity: cosineSimilarity(seedVec, deserializeVector(row.embedding)),
  }));
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k).filter((s) => s.similarity > 0.001);
}

// Score a candidate item against a user profile built from rated items
// (used for hybrid scoring + cold start)
export async function contentScoreForUser(
  userId: string,
  candidateItemId: string,
): Promise<{ score: number; signal: "content" }> {
  // Build user profile vector = weighted avg of vectors of items user rated highly
  const ratings = await db.rating.findMany({
    where: { userId, notInterested: false },
    select: { itemId: true, score: true },
  });
  if (ratings.length === 0) return { score: 0, signal: "content" };

  const vectors = await db.itemVector.findMany({
    where: { itemId: { in: ratings.map((r) => r.itemId) } },
    select: { itemId: true, embedding: true },
  });
  const vByItem = new Map(vectors.map((v) => [v.itemId, deserializeVector(v.embedding)]));

  // Aggregate weighted by rating score
  const userProfile = new Map<number, number>();
  let totalWeight = 0;
  for (const r of ratings) {
    const v = vByItem.get(r.itemId);
    if (!v) continue;
    const w = r.score; // higher rating = stronger signal
    for (const [idx, val] of v) {
      userProfile.set(idx, (userProfile.get(idx) ?? 0) + val * w);
    }
    totalWeight += w;
  }
  if (totalWeight === 0) return { score: 0, signal: "content" };
  // L2-normalize the profile
  let norm = 0;
  for (const v of userProfile.values()) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  for (const [idx, v] of userProfile) userProfile.set(idx, v / norm);

  // Get candidate vector and cosine against profile
  const candidate = await db.itemVector.findUnique({ where: { itemId: candidateItemId } });
  if (!candidate) return { score: 0, signal: "content" };
  const candVec = deserializeVector(candidate.embedding);
  const raw = cosineSimilarity(userProfile, candVec);
  // Clamp to [0,1]
  const score = Math.max(0, Math.min(1, raw));
  return { score, signal: "content" };
}
