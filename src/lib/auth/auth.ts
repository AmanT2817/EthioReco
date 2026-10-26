// EthioReco — Auth Helpers
// JWT-style tokens (HMAC-signed, base64) — no external deps needed.

import { cookies } from "next/headers";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SECRET = process.env.JWT_SECRET_KEY ?? "ethioreco-dev-secret-change-me";

interface TokenPayload {
  sub: string; // user id
  role: string;
  iat: number;
  exp: number;
}

function b64encode(s: string): string {
  return Buffer.from(s, "utf-8").toString("base64url");
}
function b64decode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf-8");
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Buffer.from(new Uint8Array(sig)).toString("base64url");
}

export async function signToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  const now = Date.now();
  const full: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };
  const payloadB64 = b64encode(JSON.stringify(full));
  const sig = await hmacSign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expectedSig = await hmacSign(payloadB64);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(b64decode(payloadB64)) as TokenPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set("ethioreco_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_MS / 1000,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete("ethioreco_token");
}

export async function getTokenFromCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get("ethioreco_token")?.value;
}

// Get the authenticated user from the cookie token
// Returns null if not authenticated or token invalid
export async function getAuthUser() {
  const token = await getTokenFromCookie();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      preferredLanguage: true,
      ethiopianPreference: true,
      onboardingCompleted: true,
      status: true,
    },
  });
  if (!user || user.status !== "active") return null;
  return user;
}

// Hash password with bcrypt-equivalent using WebCrypto (PBKDF2)
// 12 salt rounds equivalent → ~120000 PBKDF2 iterations
const PBKDF2_ITERATIONS = 120000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const hash = Buffer.from(new Uint8Array(derived)).toString("base64");
  const saltB64 = Buffer.from(salt).toString("base64");
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  const salt = Buffer.from(parts[2], "base64");
  const expectedHash = parts[3];
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const actualHash = Buffer.from(new Uint8Array(derived)).toString("base64");
  // Constant-time compare
  if (actualHash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actualHash.length; i++) {
    diff |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}
