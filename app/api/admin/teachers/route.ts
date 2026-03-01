import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const updateTeacherSchema = z
  .object({
    teacherId: z.number().int().positive(),
    status: z.enum(["APPROVED", "REJECTED"]),
    reviewNotes: z.string().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "REJECTED" && !value.reviewNotes?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Review note is required when rejecting a teacher request.",
        path: ["reviewNotes"],
      });
    }
  });

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    if (!(await isAdminUser(userId))) {
      return NextResponse.json(failure("FORBIDDEN", "Admin only"), { status: 403 });
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
      },
      orderBy: [{ teacherVerificationStatus: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        collegeId: true,
        department: true,
        teacherVerificationStatus: true,
        teacherReviewNotes: true,
        teacherVerifiedAt: true,
        createdAt: true,
        teacherReviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(success(teachers));
  } catch (error) {
    logError("admin.teachers_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch teacher requests"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    if (!(await isAdminUser(userId))) {
      return NextResponse.json(failure("FORBIDDEN", "Admin only"), { status: 403 });
    }

    const parsed = updateTeacherSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid teacher update", parsed.error.flatten()), { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: parsed.data.teacherId },
      select: { id: true, role: true },
    });

    if (!target || target.role !== "TEACHER") {
      return NextResponse.json(failure("NOT_FOUND", "Teacher request not found"), { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: parsed.data.teacherId },
      data: {
        teacherVerificationStatus: parsed.data.status,
        teacherReviewNotes: parsed.data.reviewNotes?.trim() || null,
        teacherVerifiedAt: parsed.data.status === "APPROVED" ? new Date() : null,
        teacherReviewedById: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        teacherVerificationStatus: true,
        teacherReviewNotes: true,
        teacherVerifiedAt: true,
      },
    });

    logInfo("admin.teacher_review_updated", {
      adminUserId: userId,
      teacherId: updated.id,
      status: updated.teacherVerificationStatus,
    });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("admin.teachers_update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update teacher verification"), { status: 503 });
  }
}
