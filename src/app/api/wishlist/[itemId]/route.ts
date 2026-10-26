// DELETE /api/wishlist/[itemId]
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 },
    );
  }
  const { itemId } = await ctx.params;
  await db.wishlist.deleteMany({ where: { userId: user.id, itemId } });
  return NextResponse.json({ data: { removed: true }, meta: {}, errors: [] });
}
