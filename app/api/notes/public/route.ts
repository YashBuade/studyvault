import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

const querySchema = z.object({
  q: z.string().trim().optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  subject: z.string().trim().optional(),
  semester: z.string().trim().optional(),
  tag: z.string().trim().optional(),
});

export async function GET(request: Request) {
  try {
    const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = querySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid query params", parsed.error.flatten()), {
        status: 400,
      });
    }

    const { q, cursor, subject, semester, tag } = parsed.data;
    const limit = parsed.data.limit ?? 12;

    const notes = await prisma.note.findMany({
      where: {
        isPublic: true,
        deletedAt: null,
        slug: { not: null },
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { content: { contains: q } },
                { subject: { contains: q } },
                { tags: { contains: q } },
              ],
            }
          : {}),
        ...(subject ? { subject: { equals: subject } } : {}),
        ...(semester ? { semester: { equals: semester } } : {}),
        ...(tag ? { tags: { contains: tag } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        subject: true,
        semester: true,
        tags: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            role: true,
            teacherVerificationStatus: true,
          },
        },
        attachments: {
          where: {
            file: {
              isPublic: true,
              deletedAt: null,
            },
          },
          select: {
            file: { select: { id: true, originalName: true, verificationStatus: true } },
          },
        },
      },
    });

    const hasMore = notes.length > limit;
    const sliced = hasMore ? notes.slice(0, limit) : notes;
    const data = sliced.map((note) => {
      const attachmentStatuses = note.attachments.map((item) => item.file.verificationStatus);
      const hasAttachments = attachmentStatuses.length > 0;
      const allVerified = hasAttachments && attachmentStatuses.every((status) => status === "VERIFIED");
      return {
        ...note,
        noteVerificationStatus: allVerified ? "VERIFIED" : "UNVERIFIED",
      };
    });
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return NextResponse.json(success(data, { hasMore, nextCursor }));
  } catch (error) {
    logError("notes.public_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch public notes"), { status: 503 });
  }
}
