import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const assignmentSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  dueDate: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const assignments = await prisma.assignment.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(success(assignments));
  } catch (error) {
    logError("assignments.get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch assignments"), { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = assignmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid assignment", parsed.error.flatten()), { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: parsed.data.status ?? "PENDING",
        priority: parsed.data.priority ?? "MEDIUM",
        userId,
      },
    });

    logInfo("assignments.created", { userId, assignmentId: assignment.id });
    return NextResponse.json(success(assignment), { status: 201 });
  } catch (error) {
    logError("assignments.create_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create assignment"), { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = assignmentSchema.extend({ id: z.number().int() }).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid assignment update"), { status: 400 });
    }

    const updated = await prisma.assignment.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: parsed.data.status,
        priority: parsed.data.priority,
      },
    });

    logInfo("assignments.updated", { userId, assignmentId: updated.id });
    return NextResponse.json(success(updated));
  } catch (error) {
    logError("assignments.update_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to update assignment"), { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const id = Number(new URL(request.url).searchParams.get("id"));
    if (Number.isNaN(id)) return NextResponse.json(failure("VALIDATION_ERROR", "Invalid assignment id"), { status: 400 });

    await prisma.assignment.delete({ where: { id } });
    logInfo("assignments.deleted", { userId, assignmentId: id });
    return NextResponse.json(success({ id }));
  } catch (error) {
    logError("assignments.delete_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to delete assignment"), { status: 503 });
  }
}