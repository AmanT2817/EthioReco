// GET /api/recommendations — main dashboard recs (cached, no recompute)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";
import { getCalibratedRecs } from "@/rec_engine/hybrid";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to view recommendations" } },
      { status: 401 },
    );
  }
  if (!user.onboardingCompleted) {
    return NextResponse.json(
      {
        data: { recs: [], requiresOnboarding: true },
        meta: { message: "Complete onboarding to calibrate your taste" },
        errors: [],
      },
      { status: 200 },
    );
  }

  const recs = await getCalibratedRecs(user.id);
  if (recs.length === 0) {
    return NextResponse.json({
      data: { recs: [], calibrating: true },
      meta: { message: "Calibrating your taste..." },
      errors: [],
    });
  }

  // Hydrate with item details
  const items = await db.item.findMany({
    where: { id: { in: recs.map((r) => r.itemId) } },
    include: { ethiopianMetadata: true },
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const hydrated = recs
    .map((r) => ({ ...r, item: byId.get(r.itemId) }))
    .filter((r) => r.item);

  return NextResponse.json({
    data: { recs: hydrated },
    meta: { calibratedAt: new Date().toISOString() },
    errors: [],
  });
}
