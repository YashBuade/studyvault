import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const fileId = Number((await request.json())?.id);

    if (Number.isNaN(fileId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid file id"), { status: 400 });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "File not found"), { status: 404 });
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: null },
    });

    logInfo("files.restored", { userId, fileId });
    return NextResponse.json(success({ id: fileId }));
  } catch (error) {
    logError("files.restore_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to restore file"), { status: 503 });
  }
}