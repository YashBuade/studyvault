import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const createSchema = z.object({
  noteId: z.number().int(),
  body: z.string().trim().min(1).max(2000),
});

export async function GET(request: Request) {
  try {
    const noteId = Number(new URL(request.url).searchParams.get("noteId"));
    if (Number.isNaN(noteId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid note id"), { status: 400 });
    }

    const comments = await prisma.noteComment.findMany({
      where: { noteId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(success(comments));
  } catch (error) {
    logError("notes.comments_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch comments"), { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid comment", parsed.error.flatten()), { status: 400 });
    }

    const comment = await prisma.noteComment.create({
      data: {
        noteId: parsed.data.noteId,
        body: parsed.data.body,
        userId,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    const note = await prisma.note.findUnique({
      where: { id: parsed.data.noteId },
      select: { userId: true, title: true, slug: true },
    });
    if (note && note.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: note.userId,
          type: "COMMENT",
          message: `New comment on "${note.title}"`,
          link: note.slug ? `/notes/${note.slug}` : "/dashboard/notes",
        },
      });
    }

    logInfo("notes.comment_created", { userId, noteId: parsed.data.noteId });
    return NextResponse.json(success(comment), { status: 201 });
  } catch (error) {
    logError("notes.comment_create_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to add comment"), { status: 503 });
  }
}
