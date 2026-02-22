import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const noteSchema = z.object({
  title: z.string().trim().min(1).max(140),
  content: z.string().trim().min(1).max(20000),
  subject: z.string().trim().max(120).optional(),
  semester: z.string().trim().max(40).optional(),
  tags: z.string().trim().max(240).optional(),
  isPublic: z.boolean().optional(),
  attachmentIds: z.array(z.number().int()).optional(),
});
const noteUpdateSchema = noteSchema.extend({
  id: z.number().int(),
});

const querySchema = z.object({
  q: z.string().trim().optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  includeDeleted: z.enum(["true", "false"]).optional(),
  subject: z.string().trim().optional(),
  semester: z.string().trim().optional(),
  tag: z.string().trim().optional(),
});

function createSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
  const suffix = randomBytes(4).toString("hex");
  return `${base || "note"}-${suffix}`;
}

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

    const { q, cursor, includeDeleted, subject, semester, tag } = parsed.data;
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
        ...(subject ? { subject: { equals: subject } } : {}),
        ...(semester ? { semester: { equals: semester } } : {}),
        ...(tag ? { tags: { contains: tag } } : {}),
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
        subject: parsed.data.subject,
        semester: parsed.data.semester,
        tags: parsed.data.tags,
        isPublic: parsed.data.isPublic ?? true,
        slug: createSlug(parsed.data.title),
        userId,
        attachments: parsed.data.attachmentIds?.length
          ? {
              create: parsed.data.attachmentIds.map((fileId) => ({
                file: { connect: { id: fileId } },
              })),
            }
          : undefined,
      },
      include: {
        attachments: {
          select: {
            file: { select: { id: true, originalName: true } },
          },
        },
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

    const slug = note.slug ?? (parsed.data.isPublic ?? true ? createSlug(parsed.data.title) : null);

    const updated = await prisma.note.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        subject: parsed.data.subject,
        semester: parsed.data.semester,
        tags: parsed.data.tags,
        isPublic: parsed.data.isPublic ?? true,
        slug,
        attachments: parsed.data.attachmentIds
          ? {
              deleteMany: {},
              create: parsed.data.attachmentIds.map((fileId) => ({
                file: { connect: { id: fileId } },
              })),
            }
          : undefined,
      },
      include: {
        attachments: {
          select: {
            file: { select: { id: true, originalName: true } },
          },
        },
      },
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
