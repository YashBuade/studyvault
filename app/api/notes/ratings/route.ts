import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const schema = z.object({
  noteId: z.number().int(),
  rating: z.number().int().min(1).max(5),
});

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid rating payload"), { status: 400 });
    }

    const rating = await prisma.noteRating.upsert({
      where: { noteId_userId: { noteId: parsed.data.noteId, userId } },
      create: { noteId: parsed.data.noteId, userId, rating: parsed.data.rating },
      update: { rating: parsed.data.rating },
    });

    const note = await prisma.note.findUnique({
      where: { id: parsed.data.noteId },
      select: { userId: true, title: true, slug: true },
    });
    if (note && note.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: note.userId,
          type: "RATING",
          message: `New rating on "${note.title}"`,
          link: note.slug ? `/notes/${note.slug}` : "/dashboard/notes",
        },
      });
    }

    logInfo("notes.rating_updated", { userId, noteId: parsed.data.noteId, rating: rating.rating });
    return NextResponse.json(success({ rating: rating.rating }));
  } catch (error) {
    logError("notes.rating_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update rating"), { status: 503 });
  }
}
