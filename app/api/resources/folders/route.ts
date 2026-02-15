import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const folderSchema = z.object({ name: z.string().trim().min(2).max(80) });

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const folders = await prisma.resourceFolder.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(success(folders));
  } catch (error) {
    logError("resources.folders_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch folders"), { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = folderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid folder", parsed.error.flatten()), { status: 400 });
    }

    const folder = await prisma.resourceFolder.create({
      data: { name: parsed.data.name, userId },
    });

    logInfo("resources.folder_created", { userId, folderId: folder.id });
    return NextResponse.json(success(folder), { status: 201 });
  } catch (error) {
    logError("resources.folder_create_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create folder"), { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const id = Number(new URL(request.url).searchParams.get("id"));
    if (Number.isNaN(id)) return NextResponse.json(failure("VALIDATION_ERROR", "Invalid folder id"), { status: 400 });

    await prisma.resourceFolder.delete({ where: { id } });
    logInfo("resources.folder_deleted", { userId, folderId: id });
    return NextResponse.json(success({ id }));
  } catch (error) {
    logError("resources.folder_delete_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to delete folder"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = folderSchema.extend({ id: z.number().int() }).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid folder update", parsed.error.flatten()), { status: 400 });
    }

    const folder = await prisma.resourceFolder.findUnique({ where: { id: parsed.data.id } });
    if (!folder || folder.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "Folder not found"), { status: 404 });
    }

    const updated = await prisma.resourceFolder.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    });

    logInfo("resources.folder_updated", { userId, folderId: updated.id });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("resources.folder_update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update folder"), { status: 503 });
  }
}
