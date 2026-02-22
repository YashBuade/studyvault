import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const schema = z.object({
  title: z.string().trim().min(1).max(140),
  content: z.string().trim().min(1).max(20000),
  subject: z.string().trim().max(120).optional(),
  semester: z.string().trim().max(40).optional(),
  tags: z.string().trim().max(240).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid note update", parsed.error.flatten()), { status: 400 });
    }

    const share = await prisma.noteShare.findUnique({
      where: { token },
      select: { permission: true, noteId: true },
    });

    if (!share || share.permission !== "EDIT") {
      return NextResponse.json(failure("FORBIDDEN", "Editing not allowed"), { status: 403 });
    }

    const updated = await prisma.note.update({
      where: { id: share.noteId },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        subject: parsed.data.subject,
        semester: parsed.data.semester,
        tags: parsed.data.tags,
      },
    });

    logInfo("notes.share_edit", { noteId: updated.id });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("notes.share_edit_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update note"), { status: 503 });
  }
}
