import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json(success(notifications));
  } catch (error) {
    logError("notifications.get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch notifications"), { status: 503 });
  }
}

export async function PATCH() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json(success({ updated: true }));
  } catch (error) {
    logError("notifications.read_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update notifications"), { status: 503 });
  }
}
