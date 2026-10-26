// POST /api/notifications/read — mark all (or one) as read
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/auth";
import { z } from "zod";

const Schema = z.object({
  notificationId: z.string().optional(), // if omitted, mark ALL as read
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
      { status: 401 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0].message } },
      { status: 400 },
    );
  }
  if (parsed.data.notificationId) {
    await db.notification.updateMany({
      where: { id: parsed.data.notificationId, userId: user.id },
      data: { read: true },
    });
  } else {
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }
  return NextResponse.json({ data: { ok: true }, meta: {}, errors: [] });
}
