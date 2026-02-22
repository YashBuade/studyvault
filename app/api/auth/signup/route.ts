import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getCookieOptions, signSession } from "@/lib/auth";
import { failure, success } from "@/lib/api/response";
import { logError, logInfo } from "@/lib/api/logger";
import { withDbRetry } from "@/lib/db-safe";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure("VALIDATION_ERROR", "Invalid signup data", parsed.error.flatten()), {
        status: 400,
      });
    }

    const { name, email, password } = parsed.data;
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
