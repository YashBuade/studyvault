import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

function parseQuery(request: Request) {
  const params = new URL(request.url).searchParams;
  const limit = Number(params.get("limit") ?? 10);
  const cursor = Number(params.get("cursor"));
  const includeDeleted = params.get("includeDeleted") === "true";
  const q = params.get("q")?.trim() ?? "";

  return {
    limit: Number.isNaN(limit) ? 10 : Math.min(Math.max(limit, 1), 20),
    cursor: Number.isNaN(cursor) ? undefined : cursor,
    includeDeleted,
    q,
  };
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const { limit, cursor, includeDeleted, q } = parseQuery(request);

    const files = await prisma.file.findMany({
      where: {
        userId,
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(q ? { originalName: { contains: q } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        originalName: true,
        storedName: true,
        path: true,
        mimeType: true,
        size: true,
        isPublic: true,
        verificationStatus: true,
        verificationNotes: true,
        verifiedAt: true,
        createdAt: true,
        deletedAt: true,
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const hasMore = files.length > limit;
    const data = hasMore ? files.slice(0, limit) : files;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return NextResponse.json(success(data, { hasMore, nextCursor }));
  } catch (error) {
    logError("files.get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch files"), { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const fileId = Number(new URL(request.url).searchParams.get("id"));

    if (Number.isNaN(fileId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid file id"), { status: 400 });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "File not found"), { status: 404 });
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    logInfo("files.soft_deleted", { userId, fileId });
    return NextResponse.json(success({ id: fileId }));
  } catch (error) {
    logError("files.delete_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to delete file"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const body = (await request.json()) as { id?: number; originalName?: string };
    const fileId = Number(body?.id);
    const originalName = body?.originalName?.trim();

    if (Number.isNaN(fileId) || !originalName) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid file update"), { status: 400 });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "File not found"), { status: 404 });
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { originalName },
    });

    logInfo("files.renamed", { userId, fileId });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("files.rename_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update file"), { status: 503 });
  }
}
