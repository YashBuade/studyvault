import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const share = await prisma.noteShare.findUnique({
      where: { token },
      select: {
        permission: true,
        note: {
          select: {
            id: true,
            title: true,
            content: true,
            subject: true,
            semester: true,
            tags: true,
            createdAt: true,
            user: { select: { name: true } },
            attachments: {
              select: {
                file: { select: { id: true, originalName: true } },
              },
            },
            deletedAt: true,
          },
        },
      },
    });

    if (!share?.note || share.note.deletedAt) {
      return NextResponse.json(failure("NOT_FOUND", "Share link not found"), { status: 404 });
    }

    const { deletedAt: _deletedAt, ...note } = share.note;
    void _deletedAt;
    return NextResponse.json(success({ ...note, permission: share.permission }));
  } catch (error) {
    logError("notes.share_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch shared note"), { status: 503 });
  }
}
