import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const updateSchema = z.object({
  id: z.number().int(),
  status: z.enum(["PENDING", "REVIEWED", "REJECTED"]),
  action: z.enum(["HIDE_NOTE", "DELETE_NOTE", "NONE"]).optional(),
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    if (!(await isAdminUser(userId))) {
      return NextResponse.json(failure("FORBIDDEN", "Admin only"), { status: 403 });
    }

    const reports = await prisma.noteReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        note: { select: { id: true, title: true, isPublic: true, slug: true } },
        reporter: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(success(reports));
  } catch (error) {
    logError("admin.reports_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch reports"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    if (!(await isAdminUser(userId))) {
      return NextResponse.json(failure("FORBIDDEN", "Admin only"), { status: 403 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid update", parsed.error.flatten()), { status: 400 });
    }

    if (parsed.data.action && parsed.data.action !== "NONE") {
      const report = await prisma.noteReport.findUnique({
        where: { id: parsed.data.id },
        select: { noteId: true },
      });
      if (!report) {
        return NextResponse.json(failure("NOT_FOUND", "Report not found"), { status: 404 });
      }

      if (parsed.data.action === "HIDE_NOTE") {
        await prisma.note.update({
          where: { id: report.noteId },
          data: { isPublic: false },
        });
      }
      if (parsed.data.action === "DELETE_NOTE") {
        await prisma.note.update({
          where: { id: report.noteId },
          data: { deletedAt: new Date(), isPublic: false },
        });
      }
    }

    const updated = await prisma.noteReport.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    logInfo("admin.report_updated", { userId, reportId: updated.id, status: updated.status });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("admin.report_update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update report"), { status: 503 });
  }
}
