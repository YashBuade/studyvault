import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";
import { withDbRetry } from "@/lib/db-safe";
import { signPasswordResetToken } from "@/lib/password-reset";

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid email"), { status: 400 });
    }

    const { email } = parsed.data;

    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true, passwordChanged: true },
      }),
    );

    // Always return ok to avoid email enumeration.
    if (!user || !user.passwordHash) {
      return NextResponse.json(success({ sent: true }));
    }

    const token = await signPasswordResetToken({
      sub: String(user.id),
      email: user.email,
      pwdChanged: user.passwordChanged.getTime(),
    });

    const origin = new URL(request.url).origin;
    const resetPath = `/auth/reset-password?token=${encodeURIComponent(token)}`;

    logInfo("auth.forgot_password_requested", { userId: user.id });

    const debugEnabled = process.env.PASSWORD_RESET_DEBUG === "1" || process.env.NODE_ENV !== "production";
    if (debugEnabled) {
      logInfo("auth.forgot_password_reset_url_generated", { userId: user.id, resetUrl: `${origin}${resetPath}` });
    }
    return NextResponse.json(success({ sent: true, ...(debugEnabled ? { resetUrl: resetPath } : {}) }));
  } catch (error) {
    logError("auth.forgot_password_failed", error);
    return NextResponse.json(success({ sent: true }));
  }
}
