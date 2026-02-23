import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";
import { downloadObject } from "@/lib/supabase-storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const { id } = await context.params;
    const fileId = Number(id);

    if (Number.isNaN(fileId)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid file id"), { status: 400 });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.userId !== userId || file.deletedAt) {
      return NextResponse.json(failure("NOT_FOUND", "File not found"), { status: 404 });
    }

    const objectPath = file.path.replace(/^\/?uploads\//, "");
    const buffer = await downloadObject(objectPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
  } catch (error) {
    logError("files.download_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to download file"), { status: 503 });
  }
}
