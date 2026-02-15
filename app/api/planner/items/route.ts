import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const itemSchema = z.object({
  title: z.string().trim().min(2).max(120),
  details: z.string().trim().max(400).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  categoryId: z.number().int().optional().nullable(),
});

const reorderSchema = z.object({
  id: z.number().int(),
  order: z.number().int(),
  categoryId: z.number().int().optional().nullable(),
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const items = await prisma.plannerItem.findMany({
      where: { userId },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(success(items));
  } catch (error) {
    logError("planner.items_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch items"), { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = itemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid item", parsed.error.flatten()), { status: 400 });
    }

    const count = await prisma.plannerItem.count({ where: { userId } });
    const item = await prisma.plannerItem.create({
      data: {
        title: parsed.data.title,
        details: parsed.data.details,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        priority: parsed.data.priority ?? "MEDIUM",
        status: parsed.data.status ?? "TODO",
        categoryId: parsed.data.categoryId ?? null,
        order: count,
        userId,
      },
    });

    logInfo("planner.item_created", { userId, itemId: item.id });
    return NextResponse.json(success(item), { status: 201 });
  } catch (error) {
    logError("planner.item_create_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create item"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const body = await request.json();
    if (Array.isArray(body)) {
      const parsed = z.array(reorderSchema).safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(failure("VALIDATION_ERROR", "Invalid reorder payload"), { status: 400 });
      }

      await Promise.all(
        parsed.data.map((item) =>
          prisma.plannerItem.update({
            where: { id: item.id },
            data: { order: item.order, categoryId: item.categoryId ?? null },
          }),
        ),
      );

      logInfo("planner.items_reordered", { userId, count: parsed.data.length });
      return NextResponse.json(success({ updated: true }));
    }

    const parsed = itemSchema.extend({ id: z.number().int() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid item update"), { status: 400 });
    }

    const updated = await prisma.plannerItem.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        details: parsed.data.details,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        priority: parsed.data.priority,
        status: parsed.data.status,
        categoryId: parsed.data.categoryId ?? null,
      },
    });

    logInfo("planner.item_updated", { userId, itemId: updated.id });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("planner.item_update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update item"), { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const id = Number(new URL(request.url).searchParams.get("id"));
    if (Number.isNaN(id)) return NextResponse.json(failure("VALIDATION_ERROR", "Invalid item id"), { status: 400 });

    await prisma.plannerItem.delete({ where: { id } });
    logInfo("planner.item_deleted", { userId, itemId: id });
    return NextResponse.json(success({ id }));
  } catch (error) {
    logError("planner.item_delete_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to delete item"), { status: 503 });
  }
}