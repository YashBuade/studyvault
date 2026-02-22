import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const schema = z.object({ noteId: z.number().int() });

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid like payload"), { status: 400 });
    }

    const existing = await prisma.noteLike.findUnique({
      where: { noteId_userId: { noteId: parsed.data.noteId, userId } },
    });

    if (existing) {
      await prisma.noteLike.delete({ where: { noteId_userId: { noteId: parsed.data.noteId, userId } } });
      logInfo("notes.like_removed", { userId, noteId: parsed.data.noteId });
      return NextResponse.json(success({ liked: false }));
    }

    await prisma.noteLike.create({
      data: { noteId: parsed.data.noteId, userId },
    });

    const note = await prisma.note.findUnique({
      where: { id: parsed.data.noteId },
      select: { userId: true, title: true, slug: true },
    });
    if (note && note.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: note.userId,
          type: "LIKE",
          message: `Someone liked "${note.title}"`,
          link: note.slug ? `/notes/${note.slug}` : "/dashboard/notes",
        },
      });
    }

    logInfo("notes.like_added", { userId, noteId: parsed.data.noteId });
    return NextResponse.json(success({ liked: true }));
  } catch (error) {
    logError("notes.like_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update like"), { status: 503 });
  }
}
