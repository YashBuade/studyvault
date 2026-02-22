import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  try {
    const { token, id: idStr } = await params;
    const fileId = Number(idStr);
    if (Number.isNaN(fileId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid file id"), { status: 400 });
    }

    const share = await prisma.noteShare.findUnique({
      where: { token },
      select: { noteId: true },
    });

    if (!share) {
      return NextResponse.json(failure("NOT_FOUND", "Share link not found"), { status: 404 });
    }

    const attachment = await prisma.noteAttachment.findFirst({
      where: { noteId: share.noteId, fileId },
      select: {
        file: {
          select: { path: true, mimeType: true, size: true, originalName: true, deletedAt: true },
        },
      },
    });

    if (!attachment?.file || attachment.file.deletedAt) {
      return NextResponse.json(failure("NOT_FOUND", "File not found"), { status: 404 });
    }

    const diskPath = path.join(process.cwd(), "public", attachment.file.path.replace(/^\//, ""));
    const buffer = await readFile(diskPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": attachment.file.mimeType,
        "Content-Length": String(attachment.file.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.file.originalName)}"`,
      },
    });
  } catch (error) {
    logError("files.share_download_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to download file"), { status: 503 });
  }
}
