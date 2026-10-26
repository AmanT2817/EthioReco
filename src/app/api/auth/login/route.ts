// POST /api/auth/login
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth/auth";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Invalid email or password." } },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user) {
      return NextResponse.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
        { status: 401 },
      );
    }
    if (user.status !== "active") {
      return NextResponse.json(
        { error: { code: "ACCOUNT_SUSPENDED", message: "Account suspended. Contact administrator." } },
        { status: 403 },
      );
    }
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
        { status: 401 },
      );
    }

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = await signToken({ sub: user.id, role: user.role });
    await setAuthCookie(token);

    const credit = await db.credit.findUnique({ where: { userId: user.id } });

    return NextResponse.json(
      {
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
          requiresOnboarding: !user.onboardingCompleted,
        },
        meta: { message: "Welcome back" },
        errors: [],
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Login failed. Please try again later." } },
      { status: 500 },
    );
  }
}
