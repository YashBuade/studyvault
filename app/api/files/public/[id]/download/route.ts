import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string; }> }) {
  const params = await context.params;
  try {
    const fileId = Number(params.id);
    if (Number.isNaN(fileId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid file id"), { status: 400 });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || !file.isPublic || file.deletedAt) {
      return NextResponse.json(failure("NOT_FOUND", "File not found"), { status: 404 });
    }

    const diskPath = path.join(process.cwd(), "public", file.path.replace(/^\//, ""));
    const buffer = await readFile(diskPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
  } catch (error) {
    logError("files.public_download_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to download file"), { status: 503 });
  }
}
