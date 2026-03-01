import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { getUserAccessProfile } from "@/lib/admin";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const updateSchema = z.object({
  fileId: z.number().int().positive(),
  status: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().max(1000).optional(),
});

async function hasTeacherReviewAccess(userId: number) {
  const user = await getUserAccessProfile(userId);
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.role === "TEACHER" && user.teacherVerificationStatus === "APPROVED";
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    if (!(await hasTeacherReviewAccess(userId))) {
      return NextResponse.json(failure("FORBIDDEN", "Verified teacher or admin access required"), { status: 403 });
    }

    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const whereStatus = status === "VERIFIED" || status === "REJECTED" || status === "PENDING" ? status : "PENDING";

    const files = await prisma.file.findMany({
      where: {
        isPublic: true,
        deletedAt: null,
        verificationStatus: whereStatus,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        originalName: true,
        size: true,
        mimeType: true,
        createdAt: true,
        verificationStatus: true,
        verificationNotes: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        verifiedAt: true,
      },
    });

    return NextResponse.json(success(files));
  } catch (error) {
    logError("teacher.files_review_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to load file review queue"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    if (!(await hasTeacherReviewAccess(userId))) {
      return NextResponse.json(failure("FORBIDDEN", "Verified teacher or admin access required"), { status: 403 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid file verification update", parsed.error.flatten()), {
        status: 400,
      });
    }

    const target = await prisma.file.findUnique({
      where: { id: parsed.data.fileId },
      select: { id: true, isPublic: true, deletedAt: true },
    });

    if (!target || target.deletedAt || !target.isPublic) {
      return NextResponse.json(failure("NOT_FOUND", "Public file not found"), { status: 404 });
    }

    const updated = await prisma.file.update({
      where: { id: parsed.data.fileId },
      data: {
        verificationStatus: parsed.data.status,
        verificationNotes: parsed.data.notes?.trim() || null,
        verifiedAt: new Date(),
        verifiedById: userId,
      },
      select: {
        id: true,
        verificationStatus: true,
        verificationNotes: true,
        verifiedAt: true,
      },
    });

    logInfo("teacher.files_review_updated", {
      reviewerId: userId,
      fileId: updated.id,
      status: updated.verificationStatus,
    });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("teacher.files_review_update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update file verification"), { status: 503 });
  }
}
