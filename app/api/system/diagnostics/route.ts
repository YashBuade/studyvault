import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { getGoogleOAuthConfig, resolveRequestOrigin } from "@/lib/google-auth-config";
import { prisma } from "@/lib/prisma";

function getDbUrl() {
  const candidates = [
    process.env.DATABASE_RUNTIME_URL,
    process.env.DATABASE_URL,
    process.env.DIRECT_URL,
  ]
    .map((value) => (value ?? "").trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  return candidates[0] || null;
}

function getDbInfo() {
  const url = getDbUrl();
  if (!url) return { configured: false as const, host: null, port: null, database: null };

  try {
    const parsed = new URL(url);
    return {
      configured: true as const,
      host: parsed.hostname || null,
      port: parsed.port || null,
      database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : null,
    };
  } catch {
    return { configured: true as const, host: "<invalid url>", port: null, database: null };
  }
}

async function pingDb() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true as const };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : null;
    const message =
      error instanceof Error
        ? error.message.slice(0, 220)
        : typeof error === "string"
          ? error.slice(0, 220)
          : "Database ping failed";

    return { ok: false as const, code, message };
  }
}

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const origin = resolveRequestOrigin(request);
  const google = getGoogleOAuthConfig(origin);
  const dbInfo = getDbInfo();
  const dbPing = await pingDb();

  return NextResponse.json({
    ok: true,
    diagnostics: {
      origin,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
      db: {
        ...dbInfo,
        ping: dbPing,
      },
      googleOAuth: {
        configured: Boolean(google),
        hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
        hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        redirectUri: google?.redirectUri || `${origin}/api/auth/google/callback`,
      },
      storage: {
        hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        bucket: process.env.SUPABASE_STORAGE_BUCKET || null,
      },
    },
  });
}
