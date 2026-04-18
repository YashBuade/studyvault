/* eslint-disable no-console */
/**
 * Supabase connectivity check (read-only).
 *
 * What it checks:
 * - Postgres connectivity using DATABASE_URL / DIRECT_URL (SELECT 1)
 * - Supabase Auth health endpoint: `${SUPABASE_URL}/auth/v1/health`
 * - Supabase Storage API (bucket list): `${SUPABASE_URL}/storage/v1/bucket`
 *
 * Usage:
 *   node scripts/check-supabase.cjs
 */

const dotenv = require("dotenv");
// Match Next.js style precedence: `.env` base + `.env.local` overrides.
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

function required(name) {
  const value = (process.env[name] ?? "").trim();
  return value ? value : undefined;
}

function redactUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.username = url.username ? "***" : "";
    url.password = url.password ? "***" : "";
    return url.toString();
  } catch {
    return "<invalid url>";
  }
}

function errorSummary(err) {
  if (!err) return { message: "Unknown error" };
  const summary = {
    name: err.name,
    message: err.message,
  };
  if (err.code) summary.code = err.code;
  if (err.syscall) summary.syscall = err.syscall;
  if (err.address) summary.address = err.address;
  if (err.port) summary.port = err.port;
  if (err.cause) {
    const c = err.cause;
    summary.cause = {
      name: c.name,
      message: c.message,
      code: c.code,
      syscall: c.syscall,
      address: c.address,
      port: c.port,
    };
  }
  if (err instanceof AggregateError && Array.isArray(err.errors)) {
    summary.errors = err.errors.slice(0, 3).map((e) => ({
      name: e?.name,
      message: e?.message,
      code: e?.code,
      syscall: e?.syscall,
      address: e?.address,
      port: e?.port,
    }));
  }
  return summary;
}

async function fetchJson(url, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const text = await res.text().catch(() => "");
    let json = undefined;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      // leave undefined
    }
    return { ok: res.ok, status: res.status, textSnippet: text.slice(0, 200), json };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkDb() {
  const { Pool } = require("pg");
  const connectionString = required("DATABASE_URL") || required("DIRECT_URL");
  if (!connectionString) {
    return { ok: false, error: "Missing DATABASE_URL or DIRECT_URL" };
  }

  let url;
  try {
    url = new URL(connectionString);
  } catch {
    return { ok: false, error: "DATABASE_URL/DIRECT_URL is not a valid URL", connectionString: redactUrl(connectionString) };
  }

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const result = await pool.query("select 1 as ok");
    return {
      ok: result.rows?.[0]?.ok === 1,
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\//, ""),
    };
  } catch (err) {
    return {
      ok: false,
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\//, ""),
      error: errorSummary(err),
    };
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function checkSupabaseAuth() {
  const baseUrl = (required("SUPABASE_URL") || "").replace(/\/+$/, "");
  const apiKey = required("SUPABASE_ANON_KEY") || required("SUPABASE_SERVICE_ROLE_KEY");
  if (!baseUrl) return { ok: false, error: "Missing SUPABASE_URL" };
  if (!apiKey) return { ok: false, error: "Missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY" };
  try {
    const res = await fetchJson(`${baseUrl}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return { ok: res.ok, status: res.status, snippet: res.textSnippet };
  } catch (err) {
    return { ok: false, error: errorSummary(err) };
  }
}

async function checkSupabaseStorage() {
  const baseUrl = (required("SUPABASE_URL") || "").replace(/\/+$/, "");
  const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
  if (!baseUrl) return { ok: false, error: "Missing SUPABASE_URL" };
  if (!serviceKey) return { ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };

  try {
    const res = await fetchJson(`${baseUrl}/storage/v1/bucket`, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    const bucketNames = Array.isArray(res.json)
      ? res.json
          .map((b) => (b && typeof b.name === "string" ? b.name : null))
          .filter(Boolean)
          .slice(0, 10)
      : [];

    return {
      ok: res.ok,
      status: res.status,
      buckets: bucketNames,
      snippet: res.ok ? undefined : res.textSnippet,
    };
  } catch (err) {
    return { ok: false, error: errorSummary(err) };
  }
}

async function main() {
  const results = {
    env: {
      hasDatabaseUrl: Boolean(required("DATABASE_URL") || required("DIRECT_URL")),
      hasSupabaseUrl: Boolean(required("SUPABASE_URL")),
      hasServiceRoleKey: Boolean(required("SUPABASE_SERVICE_ROLE_KEY")),
    },
    db: await checkDb(),
    supabaseAuthHealth: await checkSupabaseAuth(),
    supabaseStorage: await checkSupabaseStorage(),
  };

  console.log(JSON.stringify(results, null, 2));

  const ok =
    results.db.ok &&
    (results.supabaseAuthHealth.ok || results.supabaseStorage.ok);

  process.exitCode = ok ? 0 : 1;
}

main().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});
