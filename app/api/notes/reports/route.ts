import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const schema = z.object({
  noteId: z.number().int(),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid report", parsed.error.flatten()), { status: 400 });
    }

    const report = await prisma.noteReport.create({
      data: {
        noteId: parsed.data.noteId,
        reason: parsed.data.reason,
        details: parsed.data.details,
        reporterId: userId,
      },
    });

    const note = await prisma.note.findUnique({
      where: { id: parsed.data.noteId },
      select: { userId: true, title: true },
    });
    if (note && note.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: note.userId,
          type: "REPORT",
          message: `Your note "${note.title}" was reported`,
          link: "/dashboard/notes",
        },
      });
    }

    logInfo("notes.report_created", { userId, noteId: parsed.data.noteId, reportId: report.id });
    return NextResponse.json(success(report), { status: 201 });
  } catch (error) {
    logError("notes.report_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to report note"), { status: 503 });
  }
}
