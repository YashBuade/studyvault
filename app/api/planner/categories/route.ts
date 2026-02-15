import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(40),
  color: z.string().trim().min(4).max(16).optional(),
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const categories = await prisma.plannerCategory.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(success(categories));
  } catch (error) {
    logError("planner.categories_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch categories"), { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = categorySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid category", parsed.error.flatten()), { status: 400 });
    }

    const count = await prisma.plannerCategory.count({ where: { userId } });
    const category = await prisma.plannerCategory.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color ?? "#2563eb",
        order: count,
        userId,
      },
    });

    logInfo("planner.category_created", { userId, categoryId: category.id });
    return NextResponse.json(success(category), { status: 201 });
  } catch (error) {
    logError("planner.category_create_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create category"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = categorySchema.extend({ id: z.number().int() }).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid category update", parsed.error.flatten()), { status: 400 });
    }

    const category = await prisma.plannerCategory.findUnique({ where: { id: parsed.data.id } });
    if (!category || category.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "Category not found"), { status: 404 });
    }

    const updated = await prisma.plannerCategory.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name, color: parsed.data.color ?? category.color },
    });

    logInfo("planner.category_updated", { userId, categoryId: updated.id });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("planner.category_update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update category"), { status: 503 });
  }
}
