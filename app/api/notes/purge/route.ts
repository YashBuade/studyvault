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

    const noteId = Number((await request.json())?.id);

    if (Number.isNaN(noteId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid note id"), { status: 400 });
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } });

    if (!note || note.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "Note not found"), { status: 404 });
    }

    if (!note.deletedAt) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Note must be in trash before purging"), { status: 400 });
    }

    await prisma.note.delete({ where: { id: noteId } });

    logInfo("notes.purged", { userId, noteId });
    return NextResponse.json(success({ id: noteId }));
  } catch (error) {
    logError("notes.purge_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to purge note"), { status: 503 });
  }
}
