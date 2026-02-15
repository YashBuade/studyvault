import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getCookieOptions, signSession } from "@/lib/auth";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid credentials"), { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(failure("UNAUTHORIZED", "Invalid credentials"), { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(failure("UNAUTHORIZED", "Invalid credentials"), { status: 401 });
    }

    const token = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    logInfo("auth.login_success", { userId: user.id });
    const response = NextResponse.json(success({ authenticated: true }));
    response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions());
    return response;
  } catch (error) {
    logError("auth.login_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to login"), { status: 503 });
  }
}
