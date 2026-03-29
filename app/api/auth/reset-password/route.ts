import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";
import { withDbRetry } from "@/lib/db-safe";
import { verifyPasswordResetToken } from "@/lib/password-reset";
import { AUTH_COOKIE_NAME, getCookieOptions, signSession } from "@/lib/auth";

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid reset request"), { status: 400 });
    }

    const { token, password } = parsed.data;

    let verified: Awaited<ReturnType<typeof verifyPasswordResetToken>>;
    try {
      verified = await verifyPasswordResetToken(token);
    } catch {
      return NextResponse.json(failure("UNAUTHORIZED", "Reset link is invalid or expired"), { status: 401 });
    }

    const userId = Number(verified.sub);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json(failure("UNAUTHORIZED", "Reset link is invalid or expired"), { status: 401 });
    }

    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, passwordHash: true, passwordChanged: true },
      }),
    );

    if (!user || !user.passwordHash) {
      return NextResponse.json(failure("UNAUTHORIZED", "Reset link is invalid or expired"), { status: 401 });
    }

    if (user.email.toLowerCase() !== verified.email.toLowerCase()) {
      return NextResponse.json(failure("UNAUTHORIZED", "Reset link is invalid or expired"), { status: 401 });
    }

    if (user.passwordChanged.getTime() !== verified.pwdChanged) {
      return NextResponse.json(failure("UNAUTHORIZED", "Reset link is invalid or expired"), { status: 401 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    await withDbRetry(() =>
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordChanged: now },
      }),
    );

    const sessionToken = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    logInfo("auth.password_reset_success", { userId: user.id });
    const response = NextResponse.json(success({ reset: true, authenticated: true }));
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, getCookieOptions({ rememberMe: false }));
    return response;
  } catch (error) {
    logError("auth.reset_password_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to reset password"), { status: 503 });
  }
}
