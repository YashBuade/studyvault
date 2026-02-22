import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid user id"), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        notes: {
          where: { isPublic: true, deletedAt: null, slug: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            title: true,
            slug: true,
            subject: true,
            semester: true,
            tags: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(failure("NOT_FOUND", "User not found"), { status: 404 });
    }

    return NextResponse.json(success(user));
  } catch (error) {
    logError("public.user_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch user"), { status: 503 });
  }
}
