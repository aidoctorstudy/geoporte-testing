/**
 * Session helper for `/admin`'s single-password gate. Deliberately not a
 * real auth system — one hardcoded password (`ADMIN_PASSWORD`, server-only
 * env var), one cookie, no accounts, no database. The cookie value isn't the
 * password itself: it's an HMAC of a fixed label keyed by the password, so
 * a captured cookie reveals nothing about the password and a session check
 * never needs to store anything server-side (no DB — the brief was explicit).
 * Losing `ADMIN_PASSWORD` (e.g. rotating it) invalidates every existing
 * session automatically, which is the desired behaviour here.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/env";

export const ADMIN_SESSION_COOKIE = "geoporte_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

const sessionToken = (password: string): string =>
  createHmac("sha256", password).update("geoporte-admin-session").digest("hex");

/** Compares the submitted password against `ADMIN_PASSWORD` — timing-safe,
 * same reasoning as the cookie check below. Returns `false` (never throws)
 * when `ADMIN_PASSWORD` isn't configured, so the login route can tell that
 * case apart from "wrong password" without duplicating the env read. */
export const isCorrectPassword = (submitted: string): boolean => {
  const { ADMIN_PASSWORD } = getServerEnv();
  if (!ADMIN_PASSWORD) return false;
  const a = Buffer.from(submitted);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
};

/** Reads the session cookie and checks it against the current password's
 * token — timing-safe comparison so the check itself can't leak the token
 * byte-by-byte via response timing. */
export const isAdminSession = async (): Promise<boolean> => {
  const { ADMIN_PASSWORD } = getServerEnv();
  if (!ADMIN_PASSWORD) return false;
  const store = await cookies();
  const cookieValue = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!cookieValue) return false;
  const expected = sessionToken(ADMIN_PASSWORD);
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/** Call after `isCorrectPassword` succeeds — sets the session cookie. */
export const createAdminSession = async (): Promise<void> => {
  const { ADMIN_PASSWORD } = getServerEnv();
  if (!ADMIN_PASSWORD) return;
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, sessionToken(ADMIN_PASSWORD), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

export const clearAdminSession = async (): Promise<void> => {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
};
