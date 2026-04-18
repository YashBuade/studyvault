import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

const querySchema = z.object({
  q: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid query params", parsed.error.flatten()), { status: 400 });
    }

    const { q } = parsed.data;
    const limit = parsed.data.limit ?? 6;

    const [
      notes,
      files,
      plannerItems,
      assignments,
      exams,
      resourceFolders,
      resourceItems,
    ] = await prisma.$transaction([
      prisma.note.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { subject: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          subject: true,
          updatedAt: true,
        },
      }),
      prisma.file.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { originalName: { contains: q } },
            { mimeType: { contains: q } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          originalName: true,
          mimeType: true,
        },
      }),
      prisma.plannerItem.findMany({
        where: {
          userId,
          OR: [{ title: { contains: q } }, { details: { contains: q } }],
        },
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
        },
      }),
      prisma.assignment.findMany({
        where: {
          userId,
          OR: [{ title: { contains: q } }, { description: { contains: q } }],
        },
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
        },
      }),
      prisma.exam.findMany({
        where: {
          userId,
          OR: [{ subject: { contains: q } }, { location: { contains: q } }, { notes: { contains: q } }],
        },
        orderBy: [{ date: "asc" }],
        take: limit,
        select: {
          id: true,
          subject: true,
          status: true,
          date: true,
          location: true,
        },
      }),
      prisma.resourceFolder.findMany({
        where: { userId, name: { contains: q } },
        orderBy: [{ updatedAt: "desc" }],
        take: Math.min(4, limit),
        select: { id: true, name: true },
      }),
      prisma.resourceItem.findMany({
        where: {
          userId,
          OR: [{ title: { contains: q } }, { tags: { contains: q } }, { notes: { contains: q } }, { url: { contains: q } }],
        },
        orderBy: [{ updatedAt: "desc" }],
        take: Math.min(6, limit),
        select: {
          id: true,
          title: true,
          folderId: true,
          tags: true,
        },
      }),
    ]);

    return NextResponse.json(
      success({
        generatedAt: new Date().toISOString(),
        q,
        notes,
        files,
        plannerItems,
        assignments,
        exams,
        resourceFolders,
        resourceItems,
      }),
    );
  } catch (error) {
    logError("search.get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to search"), { status: 503 });
  }
}

