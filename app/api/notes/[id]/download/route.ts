import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string; }> }) {
  const params = await context.params;
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid note id"), { status: 400 });
    }

    const note = await prisma.note.findUnique({
      where: { id },
      select: { title: true, content: true, isPublic: true, deletedAt: true },
    });

    if (!note || note.deletedAt || !note.isPublic) {
      return NextResponse.json(failure("NOT_FOUND", "Note not found"), { status: 404 });
    }

    const plainText = note.content.replace(/<[^>]+>/g, "");
    const response = new NextResponse(plainText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${note.title.replace(/[^a-z0-9-_]+/gi, "_")}.txt"`,
      },
    });

    return response;
  } catch (error) {
    logError("notes.download_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to download note"), { status: 503 });
  }
}
