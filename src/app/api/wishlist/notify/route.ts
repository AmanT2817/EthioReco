// POST /api/wishlist/notify — toggle notifyOnMatch on a wishlist entry
// Body: { itemId, enabled: boolean }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";
import { z } from "zod";
import { scanWishlistForMatches } from "@/rec_engine/notify_match";

const Schema = z.object({
  itemId: z.string().min(1),
  enabled: z.boolean(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 },
    );
  }
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0].message } },
      { status: 400 },
    );
  }
  const { itemId, enabled } = parsed.data;

  // Must already be in wishlist
  const entry = await db.wishlist.findUnique({
    where: { userId_itemId: { userId: user.id, itemId } },
  });
  if (!entry) {
    return NextResponse.json(
      { error: { code: "NOT_IN_WISHLIST", message: "Item must be in wishlist first" } },
      { status: 404 },
    );
  }
  await db.wishlist.update({
    where: { id: entry.id },
    data: {
      notifyOnMatch: enabled,
      lastNotifiedAt: enabled ? null : entry.lastNotifiedAt,
    },
  });

  // If turning ON, immediately scan for matches so the user gets an instant signal
  if (enabled) {
    void scanWishlistForMatches(user.id).catch(() => {});
  }

  return NextResponse.json({
    data: { itemId, notifyOnMatch: enabled },
    meta: { message: enabled ? "Will notify on cross-domain matches" : "Notifications disabled" },
    errors: [],
  });
}
