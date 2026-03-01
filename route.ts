import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, AUTH_COOKIE_NAME, getCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${error}`, appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=no_code", appUrl));
  }

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("[Google Auth] Token exchange failed");
      throw new Error("Failed to retrieve tokens");
    }

    // 2. Get User Profile
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profile = await profileResponse.json();

    if (!profile.email) {
      throw new Error("No email provided from Google");
    }

    // 3. Find or Create User
    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name || profile.email.split("@")[0],
          avatarUrl: profile.picture,
          passwordHash: "", // OAuth-only users do not have a password
          role: "USER",
          onboardingSeen: false,
        },
      });
    } else {
      // Update existing user avatar if needed
      if (profile.picture && user.avatarUrl !== profile.picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: profile.picture },
        });
      }
    }

    // 4. Create Session
    const token = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    // 5. Set Cookie & Redirect
    const response = NextResponse.redirect(new URL("/dashboard", appUrl));
    const cookieOptions = getCookieOptions();
    
    response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);

    return response;

  } catch {
    console.error("[Google Auth] Callback Error");
    return NextResponse.redirect(new URL("/auth/login?error=auth_failed", appUrl));
  }
}
