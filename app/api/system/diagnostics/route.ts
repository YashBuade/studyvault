import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/require-user";
import { getGoogleOAuthConfig, resolveRequestOrigin } from "@/lib/google-auth-config";

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const origin = resolveRequestOrigin(request);
  const google = getGoogleOAuthConfig(origin);

  return NextResponse.json({
    ok: true,
    diagnostics: {
      origin,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
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
