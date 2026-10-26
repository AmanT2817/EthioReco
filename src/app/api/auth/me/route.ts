// GET /api/auth/me — current user profile
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Not authenticated" } },
      { status: 401 },
    );
  }
  const credit = await db.credit.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        ethiopianPreference: user.ethiopianPreference,
        onboardingCompleted: user.onboardingCompleted,
      },
      credits: credit?.balance ?? 0,
    },
    meta: {},
    errors: [],
  });
}
