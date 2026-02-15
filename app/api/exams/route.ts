import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const examSchema = z.object({
  subject: z.string().trim().min(2).max(120),
  date: z.string(),
  location: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(["UPCOMING", "COMPLETED"]).optional(),
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const exams = await prisma.exam.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(success(exams));
  } catch (error) {
    logError("exams.get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch exams"), { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = examSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid exam", parsed.error.flatten()), { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        subject: parsed.data.subject,
        date: new Date(parsed.data.date),
        location: parsed.data.location,
        notes: parsed.data.notes,
        status: parsed.data.status ?? "UPCOMING",
        userId,
      },
    });

    logInfo("exams.created", { userId, examId: exam.id });
    return NextResponse.json(success(exam), { status: 201 });
  } catch (error) {
    logError("exams.create_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create exam"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = examSchema.extend({ id: z.number().int() }).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid exam update"), { status: 400 });
    }

    const exam = await prisma.exam.update({
      where: { id: parsed.data.id },
      data: {
        subject: parsed.data.subject,
        date: new Date(parsed.data.date),
        location: parsed.data.location,
        notes: parsed.data.notes,
        status: parsed.data.status,
      },
    });

    logInfo("exams.updated", { userId, examId: exam.id });
    return NextResponse.json(success(exam));
  } catch (error) {
    logError("exams.update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update exam"), { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const id = Number(new URL(request.url).searchParams.get("id"));
    if (Number.isNaN(id)) return NextResponse.json(failure("VALIDATION_ERROR", "Invalid exam id"), { status: 400 });

    await prisma.exam.delete({ where: { id } });
    logInfo("exams.deleted", { userId, examId: id });
    return NextResponse.json(success({ id }));
  } catch (error) {
    logError("exams.delete_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to delete exam"), { status: 503 });
  }
}