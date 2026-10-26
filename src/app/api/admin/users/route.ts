// GET /api/admin/users — list users (admin-only)
// POST /api/admin/users — { userId, action: 'suspend'|'activate'|'delete' }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";
import { z } from "zod";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const users = await db.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, status: true,
      onboardingCompleted: true, ethiopianPreference: true, createdAt: true, lastLoginAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: users, meta: { count: users.length }, errors: [] });
}

const ActionSchema = z.object({
  userId: z.string(),
  action: z.enum(["suspend", "activate", "delete"]),
});

export async function POST(req: NextRequest) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const body = await req.json();
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0].message } },
      { status: 400 },
    );
  }
  const { userId, action } = parsed.data;
  if (userId === admin.id && action === "suspend") {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Cannot suspend yourself" } },
      { status: 400 },
    );
  }

  if (action === "delete") {
    await db.user.delete({ where: { id: userId } });
  } else {
    await db.user.update({
      where: { id: userId },
      data: { status: action === "suspend" ? "suspended" : "active" },
    });
  }
  await db.adminLog.create({
    data: { adminId: admin.id, action, targetType: "user", targetId: userId },
  });
  return NextResponse.json({ data: { userId, action }, meta: {}, errors: [] });
}
