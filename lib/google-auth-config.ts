const PLACEHOLDER_TOKENS = [
  "your-google-client-id",
  "your_google_client_id",
  "your-google-client-id-here",
  "your-google-client-secret",
  "your_google_client_secret",
  "your-google-client-secret-here",
];

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function parseAllowedOrigins() {
  const raw = process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeBaseUrl(item));
}

export function resolveRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const directOrigin = normalizeBaseUrl(requestUrl.origin);
  const appUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const forwardedOrigin =
    forwardedHost && forwardedProto ? normalizeBaseUrl(`${forwardedProto}://${forwardedHost}`) : null;

  const candidates = [forwardedOrigin, directOrigin].filter((item): item is string => Boolean(item));
  const allowedOrigins = parseAllowedOrigins();

  if (!allowedOrigins.length) {
    return candidates[0] ?? appUrl;
  }

  return candidates.find((candidate) => allowedOrigins.includes(candidate)) ?? appUrl;
}

export function isGoogleClientIdConfigured(clientId: string | undefined | null): clientId is string {
  if (!clientId) {
    return false;
  }

  const normalized = clientId.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (PLACEHOLDER_TOKENS.some((token) => normalized.includes(token))) {
    return false;
  }

  return normalized.endsWith(".apps.googleusercontent.com");
}

export function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return isGoogleClientIdConfigured(clientId) ? clientId : null;
}

export function isGoogleClientSecretConfigured(secret: string | undefined | null): secret is string {
  if (!secret) {
    return false;
  }

  const normalized = secret.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_TOKENS.some((token) => normalized.includes(token));
}

export function getGoogleOAuthConfig(origin?: string) {
  const clientId = getGoogleClientId();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !isGoogleClientSecretConfigured(clientSecret)) {
    return null;
  }

  const appUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const runtimeOrigin = origin ? normalizeBaseUrl(origin) : appUrl;
  const explicitRedirect = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  return {
    clientId,
    clientSecret,
    appUrl,
    redirectUri: explicitRedirect ? explicitRedirect : `${runtimeOrigin}/api/auth/google/callback`,
  };
}
