// GET /api/credits/history
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
  const transactions = await db.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ data: transactions, meta: { count: transactions.length }, errors: [] });
}
