import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().toLowerCase(),
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json(failure("NOT_FOUND", "User not found"), { status: 404 });
    }

    return NextResponse.json(success(user));
  } catch (error) {
    logError("profile.get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch profile"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid profile data", parsed.error.flatten()), {
        status: 400,
      });
    }

    const existing = await prisma.user.findFirst({
      where: { email: parsed.data.email, id: { not: userId } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(failure("CONFLICT", "Email already in use"), { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    logInfo("profile.updated", { userId });
    return NextResponse.json(success(user));
  } catch (error) {
    logError("profile.update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update profile"), { status: 503 });
  }
}