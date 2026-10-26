// GET /api/items/[id] — item detail
// Includes Ethiopian metadata + community rating distribution
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const item = await db.item.findUnique({
    where: { id },
    include: { ethiopianMetadata: true },
  });
  if (!item || item.status !== "active") {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Item not found" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: item, meta: {}, errors: [] });
}
