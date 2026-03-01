import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const limit = Math.min(Math.max(Number(params.get("limit") ?? 12), 1), 20);
    const cursor = Number(params.get("cursor"));
    const q = params.get("q")?.trim() ?? "";

    const files = await prisma.file.findMany({
      where: {
        isPublic: true,
        verificationStatus: "VERIFIED",
        deletedAt: null,
        ...(q ? { originalName: { contains: q } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(Number.isNaN(cursor) ? {} : { cursor: { id: cursor }, skip: 1 }),
      select: {
        id: true,
        originalName: true,
        size: true,
        createdAt: true,
        verificationStatus: true,
        verifiedAt: true,
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            teacherVerificationStatus: true,
          },
        },
      },
    });

    const hasMore = files.length > limit;
    const data = hasMore ? files.slice(0, limit) : files;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return NextResponse.json(success(data, { hasMore, nextCursor }));
  } catch (error) {
    logError("files.public_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch public files"), { status: 503 });
  }
}
