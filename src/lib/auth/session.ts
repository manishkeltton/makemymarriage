import { cookies } from "next/headers";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "mmm_session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/**
 * Hash a plain token for database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a random cryptographically secure token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Set the session cookie.
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000, // seconds
  });
}

/**
 * Clear the session cookie.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the current session token from the request cookies.
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}
