import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string; }> }) {
  const params = await context.params;
  try {
    const note = await prisma.note.findFirst({
      where: { slug: params.slug, isPublic: true, deletedAt: null },
      select: {
        id: true,
        title: true,
        content: true,
        subject: true,
        semester: true,
        tags: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        attachments: {
          where: {
            file: {
              isPublic: true,
              deletedAt: null,
              verificationStatus: "VERIFIED",
            },
          },
          select: {
            file: { select: { id: true, originalName: true } },
          },
        },
        _count: { select: { likes: true, comments: true, bookmarks: true, ratings: true } },
      },
    });

    if (!note) {
      return NextResponse.json(failure("NOT_FOUND", "Note not found"), { status: 404 });
    }

    return NextResponse.json(success(note));
  } catch (error) {
    logError("notes.public_detail_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch note"), { status: 503 });
  }
}
