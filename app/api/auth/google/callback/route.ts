import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getCookieOptions, signSession } from "@/lib/auth";
import { logError, logInfo } from "@/lib/api/logger";
import { withDbRetry } from "@/lib/db-safe";
import { getGoogleOAuthConfig, resolveRequestOrigin } from "@/lib/google-auth-config";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function GET(request: Request) {
  const origin = resolveRequestOrigin(request);
  const secureCookies = origin.startsWith("https://");
  const config = getGoogleOAuthConfig(origin);
  const appUrl = config?.appUrl || origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = new URL("/auth/login", appUrl);
  const clearStateCookie = (response: NextResponse) => {
    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: secureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  };

  if (!config) {
    loginUrl.searchParams.set("error", "google_not_configured");
    return clearStateCookie(NextResponse.redirect(loginUrl));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  const requestState = request.headers.get("cookie")?.match(/(?:^|;\s*)google_oauth_state=([^;]+)/)?.[1];

  if (oauthError) {
    loginUrl.searchParams.set("error", oauthError);
    const oauthErrorDescription = url.searchParams.get("error_description");
    if (oauthErrorDescription) {
      loginUrl.searchParams.set("error_description", oauthErrorDescription);
    }
    return clearStateCookie(NextResponse.redirect(loginUrl));
  }

  if (!state || !requestState || decodeURIComponent(requestState) !== state) {
    loginUrl.searchParams.set("error", "google_state_mismatch");
    return clearStateCookie(NextResponse.redirect(loginUrl));
  }

  if (!code) {
    loginUrl.searchParams.set("error", "missing_google_code");
    return clearStateCookie(NextResponse.redirect(loginUrl));
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenData.access_token) {
      logError("auth.google_token_exchange_failed", new Error(tokenData.error || "Google token exchange failed"));
      loginUrl.searchParams.set("error", tokenData.error || "google_token_exchange_failed");
      if (tokenData.error_description) {
        loginUrl.searchParams.set("error_description", tokenData.error_description);
      }
      return clearStateCookie(NextResponse.redirect(loginUrl));
    }

    const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = (await userInfoResponse.json()) as GoogleUserInfo;
    if (!userInfoResponse.ok || !googleUser.email || !googleUser.sub || !googleUser.email_verified) {
      logError("auth.google_userinfo_failed", new Error("Invalid Google user info"));
      loginUrl.searchParams.set("error", "google_userinfo_failed");
      return clearStateCookie(NextResponse.redirect(loginUrl));
    }

    let user = (await withDbRetry(() =>
      prisma.user.findUnique({
        where: { email: googleUser.email! },
      })
    )) as { id: number; name: string; email: string } | null;

    if (!user) {
      user = (await withDbRetry(() =>
        (prisma.user as unknown as { create: (args: unknown) => Promise<unknown> }).create({
          data: {
            email: googleUser.email!,
            name: googleUser.name || googleUser.email!.split("@")[0],
            avatarUrl: googleUser.picture,
            passwordHash: "",
            lastLoginAt: new Date(),
          },
        })
      )) as { id: number; name: string; email: string };
      logInfo("auth.google_signup", { userId: user.id, email: user.email });
    } else {
      try {
        await withDbRetry(() =>
          (prisma.user as unknown as { update: (args: unknown) => Promise<unknown> }).update({
            where: { id: user!.id },
            data: { lastLoginAt: new Date() },
          }),
        );
      } catch (updateError) {
        logError("auth.google_last_login_update_failed", updateError, { userId: user.id });
      }
      logInfo("auth.google_login", { userId: user.id, email: user.email });
    }

    const sessionToken = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    const response = clearStateCookie(NextResponse.redirect(new URL("/dashboard", origin || appUrl)));
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, getCookieOptions({ rememberMe: true }));
    return response;
  } catch (error) {
    logError("auth.google_callback_failed", error);
    loginUrl.searchParams.set("error", "google_auth_failed");
    return clearStateCookie(NextResponse.redirect(loginUrl));
  }
}
