import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";
import path from "path";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getCookieOptions, signSession } from "@/lib/auth";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";
import { withDbRetry } from "@/lib/db-safe";
import { validateCollegeId, validateTeacherExpertise } from "@/lib/teacher-validation";
import { uploadObject } from "@/lib/supabase-storage";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(100),
  role: z.enum(["STUDENT", "TEACHER"]).default("STUDENT"),
  collegeId: z.string().min(3).max(120).optional(),
  department: z.string().min(2).max(120).optional(),
});

const ID_PHOTO_MAX_MB = Number(process.env.TEACHER_ID_UPLOAD_MAX_MB ?? 5);
const ID_PHOTO_MAX_BYTES = Math.max(1, Math.min(ID_PHOTO_MAX_MB, 10)) * 1024 * 1024;
const ID_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SignupBody = z.infer<typeof signupSchema> & {
  teacherIdPhoto?: File | null;
};

async function parseSignupRequest(request: Request): Promise<SignupBody> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: (String(formData.get("role") ?? "STUDENT").toUpperCase() as "STUDENT" | "TEACHER"),
      collegeId: formData.get("collegeId") ? String(formData.get("collegeId")) : undefined,
      department: formData.get("department") ? String(formData.get("department")) : undefined,
      teacherIdPhoto: formData.get("teacherIdPhoto") instanceof File ? (formData.get("teacherIdPhoto") as File) : null,
    };
  }

  const body = (await request.json()) as Record<string, unknown>;
  return {
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    role: (String(body.role ?? "STUDENT").toUpperCase() as "STUDENT" | "TEACHER"),
    collegeId: typeof body.collegeId === "string" ? body.collegeId : undefined,
    department: typeof body.department === "string" ? body.department : undefined,
    teacherIdPhoto: null,
  };
}

export async function POST(request: Request) {
  try {
    const payload = await parseSignupRequest(request);
    const teacherIdPhoto = payload.teacherIdPhoto ?? null;
    const body = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      collegeId: payload.collegeId,
      department: payload.department,
    };
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid signup data", parsed.error.flatten()), {
        status: 400,
      });
    }

    const { name, email, password, role, collegeId, department } = parsed.data;
    if (role === "TEACHER" && (!collegeId?.trim() || !department?.trim())) {
      return NextResponse.json(
        failure("VALIDATION_ERROR", "College ID and department are required for teacher registration"),
        { status: 400 }
      );
    }

    let normalizedCollegeId: string | null = null;
    let normalizedExpertise: string | null = null;
    let teacherCollegeIdImagePath: string | null = null;
    let teacherCollegeIdImageMimeType: string | null = null;
    if (role === "TEACHER") {
      const collegeValidation = validateCollegeId(collegeId ?? "");
      if (!collegeValidation.ok) {
        return NextResponse.json(failure("VALIDATION_ERROR", collegeValidation.message), { status: 400 });
      }

      const expertiseValidation = validateTeacherExpertise(department ?? "");
      if (!expertiseValidation.ok) {
        return NextResponse.json(failure("VALIDATION_ERROR", expertiseValidation.message), { status: 400 });
      }

      normalizedCollegeId = collegeValidation.value;
      normalizedExpertise = expertiseValidation.value;

      if (!(teacherIdPhoto instanceof File)) {
        return NextResponse.json(
          failure("VALIDATION_ERROR", "Teacher registration requires a photo of your college ID"),
          { status: 400 },
        );
      }

      if (teacherIdPhoto.size <= 0 || teacherIdPhoto.size > ID_PHOTO_MAX_BYTES) {
        return NextResponse.json(
          failure("VALIDATION_ERROR", `College ID photo must be between 1 byte and ${Math.round(ID_PHOTO_MAX_BYTES / (1024 * 1024))}MB`),
          { status: 400 },
        );
      }

      if (!ID_PHOTO_TYPES.has(teacherIdPhoto.type)) {
        return NextResponse.json(
          failure("VALIDATION_ERROR", "College ID photo must be JPG, PNG, or WEBP"),
          { status: 400 },
        );
      }

      const extension = path.extname(teacherIdPhoto.name) || ".jpg";
      const unique = `teacher-id/${Date.now()}-${randomBytes(8).toString("hex")}${extension}`;
      const bytes = await teacherIdPhoto.arrayBuffer();
      await uploadObject(unique, bytes, teacherIdPhoto.type);
      teacherCollegeIdImagePath = `/uploads/${unique}`;
      teacherCollegeIdImageMimeType = teacherIdPhoto.type;
    }

    const existing = await withDbRetry(() => prisma.user.findUnique({ where: { email } }));

    if (existing) {
      return NextResponse.json(failure("CONFLICT", "Account already exists"), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await withDbRetry(() =>
      prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role === "TEACHER" ? "TEACHER" : "USER",
          collegeId: role === "TEACHER" ? normalizedCollegeId : null,
          department: role === "TEACHER" ? normalizedExpertise : null,
          teacherVerificationStatus: role === "TEACHER" ? "PENDING" : "NONE",
          teacherCollegeIdImagePath: role === "TEACHER" ? teacherCollegeIdImagePath : null,
          teacherCollegeIdImageMimeType: role === "TEACHER" ? teacherCollegeIdImageMimeType : null,
        },
      })
    );

    const token = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    logInfo("auth.signup_success", { userId: user.id });
    const response = NextResponse.json(success({ authenticated: true }));
    response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions());
    return response;
  } catch (error) {
    logError("auth.signup_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to create account"), { status: 503 });
  }
}
