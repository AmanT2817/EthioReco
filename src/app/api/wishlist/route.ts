// GET /api/wishlist — current user's wishlist
// POST /api/wishlist — add to wishlist
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 },
    );
  }
  const items = await db.wishlist.findMany({
    where: { userId: user.id },
    include: { item: { include: { ethiopianMetadata: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: items, meta: { count: items.length }, errors: [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to use wishlist" } },
      { status: 401 },
    );
  }
  const { itemId, priority, notes } = await req.json();
  if (!itemId) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "itemId required" } },
      { status: 400 },
    );
  }
  const item = await db.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Item not found" } },
      { status: 404 },
    );
  }
  const entry = await db.wishlist.upsert({
    where: { userId_itemId: { userId: user.id, itemId } },
    create: { userId: user.id, itemId, priority: priority ?? "medium", notes },
    update: { priority: priority ?? "medium", notes },
  });
  return NextResponse.json(
    { data: entry, meta: { message: "Added to wishlist" }, errors: [] },
    { status: 201 },
  );
}
