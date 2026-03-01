import { randomBytes } from "crypto";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";
import { uploadObject } from "@/lib/supabase-storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const isPublic = formData.get("isPublic") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "No file provided"), { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(failure("VALIDATION_ERROR", "File exceeds 10MB limit"), { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const extension = path.extname(file.name);
    const unique = `${Date.now()}-${randomBytes(8).toString("hex")}${extension}`;
    const objectPath = `u-${userId}/${unique}`;
    const relativePath = `/uploads/${objectPath}`;

    await uploadObject(objectPath, bytes, file.type || "application/octet-stream");

    try {
      const created = await prisma.file.create({
        data: {
          originalName: file.name,
          storedName: unique,
          path: relativePath,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          isPublic,
          verificationStatus: isPublic ? "PENDING" : "VERIFIED",
          userId,
        },
      });

      logInfo("files.uploaded", { userId, fileId: created.id });
      return NextResponse.json(success(created), { status: 201 });
    } catch (error) {
      logError("files.metadata_failed", error, { userId });
      return NextResponse.json(failure("INTERNAL_ERROR", "Unable to store file metadata"), { status: 503 });
    }
  } catch (error) {
    logError("files.upload_failed", error);
    const details = error instanceof Error ? error.message : "Unknown upload error";
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to upload file", { details }), { status: 503 });
  }
}
