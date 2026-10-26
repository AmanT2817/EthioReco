// POST /api/auth/register
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0].message } },
        { status: 400 },
      );
    }
    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { error: { code: "EMAIL_EXISTS", message: "This email is already registered." } },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        status: "active",
        role: "user",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Initial 100 credits — handled by application-layer logic (since SQLite has no triggers in Prisma)
    await db.credit.create({ data: { userId: user.id, balance: 100 } });
    await db.creditTransaction.create({
      data: { userId: user.id, amount: 100, reason: "initial" },
    });

    const token = await signToken({ sub: user.id, role: user.role });
    await setAuthCookie(token);

    return NextResponse.json(
      {
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          credits: 100,
          requiresOnboarding: true,
        },
        meta: { message: "Account created — begin discovery" },
        errors: [],
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Registration failed. Please try again later." } },
      { status: 500 },
    );
  }
}
