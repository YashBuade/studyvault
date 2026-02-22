import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "studyvault_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const LONG_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
};

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return new TextEncoder().encode(secret ?? "local-dev-secret-change-me");
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    return {
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    } satisfies SessionPayload;
  } catch {
    return null;
  }
}

export function getCookieOptions(options?: { rememberMe?: boolean }) {
  const rememberMe = options?.rememberMe ?? false;
  const maxAge = rememberMe ? LONG_SESSION_DURATION_SECONDS : SESSION_DURATION_SECONDS;

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}
