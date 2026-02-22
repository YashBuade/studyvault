import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const schema = z.object({
  noteId: z.number().int(),
  fileId: z.number().int(),
});

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid attachment", parsed.error.flatten()), { status: 400 });
    }

    const note = await prisma.note.findUnique({ where: { id: parsed.data.noteId } });
    if (!note || note.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "Note not found"), { status: 404 });
    }

    const file = await prisma.file.findUnique({ where: { id: parsed.data.fileId } });
    if (!file || file.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "File not found"), { status: 404 });
    }

    const attachment = await prisma.noteAttachment.create({
      data: {
        noteId: parsed.data.noteId,
        fileId: parsed.data.fileId,
      },
    });

    logInfo("notes.attachment_added", { userId, noteId: parsed.data.noteId, fileId: parsed.data.fileId });
    return NextResponse.json(success(attachment), { status: 201 });
  } catch (error) {
    logError("notes.attachment_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to attach file"), { status: 503 });
  }
}
