// GET /api/notifications — list current user's notifications
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
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { item: { include: { ethiopianMetadata: true } } },
  });
  const unreadCount = notifications.filter((n) => !n.read).length;
  return NextResponse.json({
    data: notifications,
    meta: { count: notifications.length, unreadCount },
    errors: [],
  });
}
