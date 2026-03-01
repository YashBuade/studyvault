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

function getObjectEndpoint(objectPath: string) {
  const cfg = getStorageConfig();
  const normalizedPath = objectPath
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${cfg.url}/storage/v1/object/${cfg.bucket}/${normalizedPath}`;
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
  const endpoint = getObjectEndpoint(objectPath);
  const blob = new Blob([bytes], { type: contentType });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...getAuthHeaders(contentType),
      "x-upsert": "false",
    },
    body: blob,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Supabase upload failed: ${response.status} ${payload}`);
  }
}

export async function downloadObject(objectPath: string) {
  const endpoint = getObjectEndpoint(objectPath);
  const response = await fetch(endpoint, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Supabase download failed: ${response.status} ${payload}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function deleteObject(objectPath: string) {
  const endpoint = getObjectEndpoint(objectPath);
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok && response.status !== 404) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Supabase delete failed: ${response.status} ${payload}`);
  }
}
