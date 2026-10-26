// POST /api/auth/logout
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/auth";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ data: { loggedOut: true }, meta: {}, errors: [] });
}
