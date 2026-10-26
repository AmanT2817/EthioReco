// GET /api/recommendations/cross-domain
// Standalone cross-domain surfacing (used by dashboard "Cross-Domain Discovery" rail)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";
import { buildCrossDomainRecsFromUserId } from "@/rec_engine/hybrid";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 },
    );
  }
  const recs = await buildCrossDomainRecsFromUserId(user.id);
  const items = await db.item.findMany({
    where: { id: { in: recs.map((r) => r.itemId) } },
    include: { ethiopianMetadata: true },
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const hydrated = recs.map((r) => ({ ...r, item: byId.get(r.itemId) })).filter((r) => r.item);
  return NextResponse.json({ data: { recs: hydrated }, meta: {}, errors: [] });
}
