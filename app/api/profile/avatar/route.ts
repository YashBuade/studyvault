import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(failure("VALIDATION_ERROR", "No image provided"), { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Only image uploads are allowed"), { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name) || ".png";
    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${extension}`;
    const folder = path.join(process.cwd(), "public", "uploads", "avatars");
    const absolutePath = path.join(folder, filename);
    const relativePath = `/uploads/avatars/${filename}`;

    await mkdir(folder, { recursive: true });
    await writeFile(absolutePath, bytes);

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: relativePath },
    });

    logInfo("profile.avatar_updated", { userId });
    return NextResponse.json(success({ avatarUrl: relativePath }));
  } catch (error) {
    logError("profile.avatar_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to upload avatar"), { status: 503 });
  }
}