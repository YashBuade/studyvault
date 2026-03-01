import { NextResponse } from "next/server";
import { failure } from "@/lib/api/response";
import { getGoogleOAuthConfig, resolveRequestOrigin } from "@/lib/google-auth-config";

export async function GET(request: Request) {
  const origin = resolveRequestOrigin(request);
  const config = getGoogleOAuthConfig(origin);
  const secureCookies = origin.startsWith("https://");

  if (!config) {
    return NextResponse.redirect(new URL("/auth/login?error=google_not_configured", request.url));
  }

  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}

export async function POST() {
  return NextResponse.json(
    failure("VALIDATION_ERROR", "Use redirect-based Google OAuth via GET /api/auth/google"),
    { status: 405 }
  );
}
