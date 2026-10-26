// POST /api/recommendations/refresh — trigger recalc (uses 1 credit)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";
import { calibrateUserTaste } from "@/rec_engine/hybrid";

const REFRESH_COST = 1;
const REFRESH_LIMIT_PER_HOUR = 10;

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to refresh recommendations" } },
      { status: 401 },
    );
  }

  // Rate limit: 10 refreshes per hour per user (per spec)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentRefreshes = await db.creditTransaction.count({
    where: {
      userId: user.id,
      reason: "rec_refresh",
      createdAt: { gte: oneHourAgo },
    },
  });
  if (recentRefreshes >= REFRESH_LIMIT_PER_HOUR) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT",
          message: "Recalibration limit reached. Try again in a few minutes.",
        },
      },
      { status: 429 },
    );
  }

  // Deduct credit
  const credit = await db.credit.findUnique({ where: { userId: user.id } });
  if (!credit || credit.balance < REFRESH_COST) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_CREDITS", message: "Not enough credits to recalibrate." } },
      { status: 402 },
    );
  }
  await db.credit.update({
    where: { userId: user.id },
    data: { balance: { decrement: REFRESH_COST } },
  });
  await db.creditTransaction.create({
    data: { userId: user.id, amount: -REFRESH_COST, reason: "rec_refresh" },
  });

  // Recalibrate
  const recs = await calibrateUserTaste(user.id);

  // Hydrate items
  const items = await db.item.findMany({
    where: { id: { in: recs.map((r) => r.itemId) } },
    include: { ethiopianMetadata: true },
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const hydrated = recs.map((r) => ({ ...r, item: byId.get(r.itemId) })).filter((r) => r.item);

  const updatedCredit = await db.credit.findUnique({ where: { userId: user.id } });

  return NextResponse.json({
    data: { recs: hydrated },
    meta: {
      creditsRemaining: updatedCredit?.balance ?? 0,
      calibratedAt: new Date().toISOString(),
      count: hydrated.length,
    },
    errors: [],
  });
}
