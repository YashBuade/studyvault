import { SignJWT, jwtVerify } from "jose";

const RESET_TOKEN_TTL_SECONDS = 60 * 30;

type ResetTokenPayload = {
  sub: string;
  email: string;
  pwdChanged: number;
  type: "password_reset";
};

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return new TextEncoder().encode(secret ?? "local-dev-secret-change-me");
}

export async function signPasswordResetToken(payload: Omit<ResetTokenPayload, "type">) {
  return new SignJWT({ ...payload, type: "password_reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${RESET_TOKEN_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyPasswordResetToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (payload.type !== "password_reset") {
    throw new Error("Invalid token type");
  }

  return {
    sub: String(payload.sub ?? ""),
    email: String(payload.email ?? ""),
    pwdChanged: Number(payload.pwdChanged ?? 0),
    type: "password_reset",
  } satisfies ResetTokenPayload;
}

