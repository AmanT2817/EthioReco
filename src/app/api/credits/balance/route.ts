// GET /api/credits/balance
import { NextResponse } from "next/server";
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
  const credit = await db.credit.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    data: { balance: credit?.balance ?? 0 },
    meta: { updatedAt: credit?.updatedAt },
    errors: [],
  });
}
