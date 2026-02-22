import { NextResponse } from "next/server";
import {
  getGoogleOAuthConfig,
  getGoogleClientId,
  isGoogleClientSecretConfigured,
  resolveRequestOrigin,
} from "@/lib/google-auth-config";

export async function GET(request: Request) {
  const origin = resolveRequestOrigin(request);
  const clientId = getGoogleClientId();
  const clientSecretOk = isGoogleClientSecretConfigured(process.env.GOOGLE_CLIENT_SECRET);
  const config = getGoogleOAuthConfig(origin);
  const allowedOrigins = (process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return NextResponse.json({
    ok: Boolean(config),
    hasClientId: Boolean(clientId),
    hasClientSecret: clientSecretOk,
    redirectUri: config?.redirectUri ?? null,
    appUrl: config?.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? null,
    origin,
    allowedOrigins,
    loginEndpoint: "/api/auth/google",
  });
}
