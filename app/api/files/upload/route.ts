import { randomBytes } from "crypto";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";
import { uploadObject } from "@/lib/supabase-storage";

const MAX_FILE_SIZE_MB = Number(process.env.FILE_UPLOAD_MAX_MB ?? 4);
const MAX_FILE_SIZE = Math.max(1, Math.min(MAX_FILE_SIZE_MB, 25)) * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

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

    if (!file.name.trim()) {
      return NextResponse.json(failure("VALIDATION_ERROR", "File name is required"), { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json(failure("VALIDATION_ERROR", "File is empty"), { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        failure("VALIDATION_ERROR", `File exceeds ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB limit`),
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        failure("VALIDATION_ERROR", "File type not supported for upload"),
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const extension = path.extname(file.name);
    const unique = `${Date.now()}-${randomBytes(8).toString("hex")}${extension}`;
    let objectPath = `u-${userId}/${unique}`;
    let relativePath = `/uploads/${objectPath}`;

    try {
      await uploadObject(objectPath, bytes, mimeType);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const allowLocalFallback = process.env.LOCAL_UPLOAD_FALLBACK !== "false";
      const isNetworkStorageFailure = message.includes("supabase storage request failed") || message.includes("fetch failed");

      if (!allowLocalFallback || !isNetworkStorageFailure) {
        throw error;
      }

      objectPath = `local/${objectPath}`;
      relativePath = `/uploads/${objectPath}`;
      await uploadObject(objectPath, bytes, mimeType);
      logInfo("files.upload_fallback_local_storage", { userId, objectPath });
    }

    try {
      const created = await prisma.file.create({
        data: {
          originalName: file.name,
          storedName: unique,
          path: relativePath,
          mimeType,
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
    const upstreamFailure = details.toLowerCase().includes("supabase");
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to upload file", { details }), {
      status: upstreamFailure ? 502 : 503,
    });
  }
}
