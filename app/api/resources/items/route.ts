import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const itemSchema = z.object({
  title: z.string().trim().min(2).max(120),
  url: z.string().trim().url().optional(),
  notes: z.string().trim().max(500).optional(),
  tags: z.string().trim().max(200).optional(),
  folderId: z.number().int().optional().nullable(),
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const items = await prisma.resourceItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(success(items));
  } catch (error) {
    logError("resources.items_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch resources"), { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = itemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid resource", parsed.error.flatten()), { status: 400 });
    }

    const item = await prisma.resourceItem.create({
      data: {
        title: parsed.data.title,
        url: parsed.data.url,
        notes: parsed.data.notes,
        tags: parsed.data.tags,
        folderId: parsed.data.folderId ?? null,
        userId,
      },
    });

    logInfo("resources.item_created", { userId, itemId: item.id });
    return NextResponse.json(success(item), { status: 201 });
  } catch (error) {
    logError("resources.item_create_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create resource"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = itemSchema.extend({ id: z.number().int() }).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid resource update"), { status: 400 });
    }

    const item = await prisma.resourceItem.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        url: parsed.data.url,
        notes: parsed.data.notes,
        tags: parsed.data.tags,
        folderId: parsed.data.folderId ?? null,
      },
    });

    logInfo("resources.item_updated", { userId, itemId: item.id });
    return NextResponse.json(success(item));
  } catch (error) {
    logError("resources.item_update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update resource"), { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const id = Number(new URL(request.url).searchParams.get("id"));
    if (Number.isNaN(id)) return NextResponse.json(failure("VALIDATION_ERROR", "Invalid resource id"), { status: 400 });

    await prisma.resourceItem.delete({ where: { id } });
    logInfo("resources.item_deleted", { userId, itemId: id });
    return NextResponse.json(success({ id }));
  } catch (error) {
    logError("resources.item_delete_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to delete resource"), { status: 503 });
  }
}