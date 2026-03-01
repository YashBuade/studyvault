import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { failure } from "@/lib/api/response";
import { downloadObject } from "@/lib/supabase-storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
  }

  const admin = await isAdminUser(userId);
  if (!admin) {
    return NextResponse.json(failure("FORBIDDEN", "Admin only"), { status: 403 });
  }

  const { id } = await context.params;
  const teacherId = Number(id);
  if (Number.isNaN(teacherId)) {
    return NextResponse.json(failure("VALIDATION_ERROR", "Invalid teacher id"), { status: 400 });
  }

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: {
      role: true,
      teacherCollegeIdImagePath: true,
      teacherCollegeIdImageMimeType: true,
    },
  });

  if (!teacher || teacher.role !== "TEACHER" || !teacher.teacherCollegeIdImagePath) {
    return NextResponse.json(failure("NOT_FOUND", "Teacher ID photo not found"), { status: 404 });
  }

  const objectPath = teacher.teacherCollegeIdImagePath.replace(/^\/?uploads\//, "");
  const buffer = await downloadObject(objectPath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": teacher.teacherCollegeIdImageMimeType || "image/jpeg",
      "Content-Disposition": `inline; filename="teacher-id-${teacherId}"`,
    },
  });
}
