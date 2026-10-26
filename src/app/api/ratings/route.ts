// POST /api/ratings — submit rating (or update if exists)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";
import { recomputeAllItemVectors } from "@/rec_engine/content_based";
import { z } from "zod";

const RatingSchema = z.object({
  itemId: z.string().min(1),
  score: z.number().min(0.5).max(5).refine((n) => n * 2 === Math.floor(n * 2), {
    message: "Score must be a multiple of 0.5",
  }),
  review: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to rate items" } },
      { status: 401 },
    );
  }
  const body = await req.json();
  const parsed = RatingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0].message } },
      { status: 400 },
    );
  }
  const { itemId, score, review } = parsed.data;
  const item = await db.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Item not found" } },
      { status: 404 },
    );
  }

  const rating = await db.rating.upsert({
    where: { userId_itemId: { userId: user.id, itemId } },
    create: { userId: user.id, itemId, score, review },
    update: { score, review, updatedAt: new Date() },
  });

  // Update item's average_rating + rating_count (manual trigger replacement)
  const stats = await db.rating.aggregate({
    where: { itemId, notInterested: false },
    _avg: { score: true },
    _count: true,
  });
  await db.item.update({
    where: { id: itemId },
    data: {
      averageRating: stats._avg.score ?? 0,
      ratingCount: stats._count,
    },
  });

  // Award credit reward for rating (+2 per rating, capped per day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await db.creditTransaction.count({
    where: {
      userId: user.id,
      reason: "rating_reward",
      createdAt: { gte: today },
    },
  });
  if (todayCount < 10) {
    await db.credit.upsert({
      where: { userId: user.id },
      create: { userId: user.id, balance: 100 + 2 },
      update: { balance: { increment: 2 } },
    });
    await db.creditTransaction.create({
      data: { userId: user.id, amount: 2, reason: "rating_reward" },
    });
  }

  // Invalidate recs (per spec: on rating submit, invalidate that user's recs asynchronously)
  await db.recommendation.deleteMany({ where: { userId: user.id } });

  // Refit vectors in background (cheap; lazy rebuild on next rec request would also work)
  void recomputeAllItemVectors();

  return NextResponse.json(
    {
      data: {
        rating: { id: rating.id, score: rating.score, itemId: rating.itemId },
        itemStats: {
          averageRating: stats._avg.score ?? 0,
          ratingCount: stats._count,
        },
      },
      meta: { creditsAwarded: todayCount < 10 ? 2 : 0 },
      errors: [],
    },
    { status: 201 },
  );
}
