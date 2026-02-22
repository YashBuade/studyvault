import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const schema = z.object({
  noteId: z.number().int(),
  permission: z.enum(["VIEW", "EDIT"]).optional(),
});

function createToken() {
  return randomBytes(16).toString("hex");
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid share request", parsed.error.flatten()), { status: 400 });
    }

    const note = await prisma.note.findUnique({ where: { id: parsed.data.noteId } });
    if (!note || note.userId !== userId) {
      return NextResponse.json(failure("NOT_FOUND", "Note not found"), { status: 404 });
    }

    const share = await prisma.noteShare.create({
      data: {
        token: createToken(),
        noteId: parsed.data.noteId,
        creatorId: userId,
        permission: parsed.data.permission ?? "VIEW",
      },
    });

    logInfo("notes.share_created", { userId, noteId: note.id });
    return NextResponse.json(success({ token: share.token, permission: share.permission }));
  } catch (error) {
    logError("notes.share_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create share link"), { status: 503 });
  }
}
