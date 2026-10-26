// GET /api/ratings/mine — current user's rating history
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to view your ratings" } },
      { status: 401 },
    );
  }
  const ratings = await db.rating.findMany({
    where: { userId: user.id },
    include: { item: { include: { ethiopianMetadata: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ data: ratings, meta: { count: ratings.length }, errors: [] });
}
