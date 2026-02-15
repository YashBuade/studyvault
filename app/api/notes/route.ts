import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const noteSchema = z.object({
  title: z.string().trim().min(1).max(140),
  content: z.string().trim().min(1).max(20000),
});
const noteUpdateSchema = noteSchema.extend({
  id: z.number().int(),
});

const querySchema = z.object({
  q: z.string().trim().optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  includeDeleted: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = querySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid query params", parsed.error.flatten()), {
        status: 400,
      });
    }

    const { q, cursor, includeDeleted } = parsed.data;
    const limit = parsed.data.limit ?? 10;

    const notes = await prisma.note.findMany({
      where: {
        userId,
        ...(includeDeleted === "true" ? {} : { deletedAt: null }),
        ...(q
          ? {
              OR: [{ title: { contains: q } }, { content: { contains: q } }],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = notes.length > limit;
    const data = hasMore ? notes.slice(0, limit) : notes;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return NextResponse.json(success(data, { hasMore, nextCursor }));
  } catch (error) {
    logError("notes.get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch notes"), { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const body = await request.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid note data", parsed.error.flatten()), {
        status: 400,
      });
    }

    const note = await prisma.note.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        userId,
      },
    });

    logInfo("notes.created", { userId, noteId: note.id });
    return NextResponse.json(success(note), { status: 201 });
  } catch (error) {
    logError("notes.create_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create note"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const parsed = noteUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid note update", parsed.error.flatten()), {
        status: 400,
      });
    }

    const note = await prisma.note.findUnique({ where: { id: parsed.data.id } });
    if (!note || note.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "Note not found"), { status: 404 });
    }

    const updated = await prisma.note.update({
      where: { id: parsed.data.id },
      data: { title: parsed.data.title, content: parsed.data.content },
    });

    logInfo("notes.updated", { userId, noteId: updated.id });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("notes.update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update note"), { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const noteId = Number(new URL(request.url).searchParams.get("id"));

    if (Number.isNaN(noteId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid note id"), { status: 400 });
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } });

    if (!note || note.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "Note not found"), { status: 404 });
    }

    await prisma.note.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });

    logInfo("notes.soft_deleted", { userId, noteId });
    return NextResponse.json(success({ id: noteId }));
  } catch (error) {
    logError("notes.delete_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to delete note"), { status: 503 });
  }
}
