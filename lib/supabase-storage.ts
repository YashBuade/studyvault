import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

function getStorageConfig() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) {
    throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET are required.");
  }

  return {
    url: SUPABASE_URL.replace(/\/+$/, ""),
    key: SUPABASE_SERVICE_ROLE_KEY,
    bucket: SUPABASE_STORAGE_BUCKET,
  };
}

function isLocalObjectPath(objectPath: string) {
  return objectPath.startsWith("local/");
}

function getLocalUploadsRoot() {
  return process.env.LOCAL_UPLOADS_DIR?.trim() || path.join(process.cwd(), "public", "uploads");
}

function toLocalAbsolutePath(objectPath: string) {
  const relative = objectPath.replace(/^local\//, "").replace(/^\/+/, "");
  return path.join(getLocalUploadsRoot(), relative);
}

function normalizeObjectPath(objectPath: string) {
  return objectPath
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getBaseEndpoints() {
  const cfg = getStorageConfig();
  const endpoints = [cfg.url];

  // Fallback endpoint for projects that route storage through dedicated subdomain.
  const match = cfg.url.match(/^https:\/\/([^.]+)\.supabase\.co$/);
  if (match?.[1]) {
    endpoints.push(`https://${match[1]}.storage.supabase.co`);
  }

  return Array.from(new Set(endpoints));
}

function getObjectEndpoints(objectPath: string) {
  const cfg = getStorageConfig();
  const normalizedPath = normalizeObjectPath(objectPath);
  return getBaseEndpoints().map((base) => `${base}/storage/v1/object/${cfg.bucket}/${normalizedPath}`);
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const { timeoutMs = 20000, ...requestInit } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...requestInit,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchStorageWithFallback(
  endpoints: string[],
  init: RequestInit & { timeoutMs?: number },
) {
  const failures: string[] = [];
  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(endpoint, { ...init, cache: "no-store" });
      if (response.ok) {
        return response;
      }

      const payload = await response.text().catch(() => "");
      failures.push(`${endpoint} -> ${response.status} ${payload}`.trim());
    } catch (error) {
      failures.push(`${endpoint} -> ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  throw new Error(`Supabase storage request failed. Attempts: ${failures.join(" || ")}`);
}

function getAuthHeaders(contentType?: string) {
  const cfg = getStorageConfig();
  const headers: Record<string, string> = {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

export async function uploadObject(objectPath: string, bytes: ArrayBuffer, contentType: string) {
  if (isLocalObjectPath(objectPath)) {
    const absolutePath = toLocalAbsolutePath(objectPath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, Buffer.from(bytes));
    return;
  }

  const endpoints = getObjectEndpoints(objectPath);
  const blob = new Blob([bytes], { type: contentType });
  await fetchStorageWithFallback(endpoints, {
    method: "POST",
    headers: {
      ...getAuthHeaders(contentType),
      "x-upsert": "false",
    },
    body: blob,
  });
}

export async function downloadObject(objectPath: string) {
  if (isLocalObjectPath(objectPath)) {
    const absolutePath = toLocalAbsolutePath(objectPath);
    return readFile(absolutePath);
  }

  const endpoints = getObjectEndpoints(objectPath);
  const response = await fetchStorageWithFallback(endpoints, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return Buffer.from(await response.arrayBuffer());
}

export async function deleteObject(objectPath: string) {
  if (isLocalObjectPath(objectPath)) {
    const absolutePath = toLocalAbsolutePath(objectPath);
    await unlink(absolutePath).catch(() => undefined);
    return;
  }

  const endpoints = getObjectEndpoints(objectPath);
  try {
    await fetchStorageWithFallback(endpoints, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    // Ignore object-not-found style failures to keep delete idempotent.
    const message = error instanceof Error ? error.message : "";
    if (!message.includes(" 404 ")) {
      throw error;
    }
  }
}
