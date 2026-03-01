import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getCookieOptions, signSession } from "@/lib/auth";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";
import { isTransientDbPoolError, withDbRetry } from "@/lib/db-safe";

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
  expectedRole: z.enum(["TEACHER", "STUDENT"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid credentials"), { status: 400 });
    }

    const { email, password, rememberMe, expectedRole } = parsed.data;
    
    let user;
    try {
      user = await withDbRetry(() => prisma.user.findUnique({ where: { email } }));
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        failure(
          "INTERNAL_ERROR",
          isTransientDbPoolError(dbError)
            ? "Database is busy. Please retry in a few seconds."
            : "Database connection failed"
        ),
        { status: 500 }
      );
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json(failure("UNAUTHORIZED", "Invalid credentials"), { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(failure("UNAUTHORIZED", "Invalid credentials"), { status: 401 });
    }

    if (expectedRole === "TEACHER" && user.role !== "TEACHER") {
      return NextResponse.json(failure("FORBIDDEN", "This login is for teacher accounts only"), { status: 403 });
    }

    if (expectedRole === "STUDENT" && user.role === "TEACHER") {
      return NextResponse.json(failure("FORBIDDEN", "Use teacher login for teacher accounts"), { status: 403 });
    }

    const token = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    logInfo("auth.login_success", { userId: user.id });
    const response = NextResponse.json(success({ authenticated: true }));
    response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions({ rememberMe }));
    return response;
  } catch (error) {
    logError("auth.login_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to login"), { status: 503 });
  }
}
