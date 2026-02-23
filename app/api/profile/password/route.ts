import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid password payload", parsed.error.flatten()), {
        status: 400,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json(failure("NOT_FOUND", "User not found"), { status: 404 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(failure("UNAUTHORIZED", "Password login is not configured for this account"), { status: 401 });
    }

    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(failure("UNAUTHORIZED", "Current password is incorrect"), { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
        passwordChanged: new Date(),
      },
    });

    logInfo("profile.password_changed", { userId });
    return NextResponse.json(success({ updated: true }));
  } catch (error) {
    logError("profile.password_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to change password"), { status: 503 });
  }
}
