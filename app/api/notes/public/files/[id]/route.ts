import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";
import { downloadObject } from "@/lib/supabase-storage";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string; }> }) {
  const params = await context.params;
  try {
    const fileId = Number(params.id);
    if (Number.isNaN(fileId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid file id"), { status: 400 });
    }

    const attachment = await prisma.noteAttachment.findFirst({
      where: {
        fileId,
        note: { isPublic: true, deletedAt: null },
      },
      select: {
        file: {
          select: {
            path: true,
            mimeType: true,
            size: true,
            originalName: true,
            deletedAt: true,
            isPublic: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (
      !attachment?.file ||
      attachment.file.deletedAt ||
      !attachment.file.isPublic ||
      attachment.file.verificationStatus !== "VERIFIED"
    ) {
      return NextResponse.json(failure("NOT_FOUND", "File not found"), { status: 404 });
    }

    const objectPath = attachment.file.path.replace(/^\/?uploads\//, "");
    const buffer = await downloadObject(objectPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": attachment.file.mimeType,
        "Content-Length": String(attachment.file.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.file.originalName)}"`,
      },
    });
  } catch (error) {
    logError("files.public_download_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to download file"), { status: 503 });
  }
}
