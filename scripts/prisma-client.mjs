import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function asValidConnectionString(value) {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  const unquoted = trimmed.replace(/^['"]|['"]$/g, "").trim();
  if (!unquoted) return undefined;
  if (unquoted.includes("${")) return undefined;
  if (!unquoted.startsWith("postgresql://") && !unquoted.startsWith("postgres://")) return undefined;
  if (/\s/.test(unquoted)) return undefined;
  try {
    const url = new URL(unquoted);
    if (!url.hostname) return undefined;
    return unquoted;
  } catch {
    return undefined;
  }
}

function isLocalHostname(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function inferSslFromConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    const sslmode = (url.searchParams.get("sslmode") ?? "").trim().toLowerCase();
    if (!sslmode) return undefined;
    if (sslmode === "disable" || sslmode === "allow") return false;
    return true;
  } catch {
    return undefined;
  }
}

function shouldEnableTls(connectionString) {
  const fromUrl = inferSslFromConnectionString(connectionString);
  if (typeof fromUrl === "boolean") return fromUrl;

  try {
    const url = new URL(connectionString);
    if (isLocalHostname(url.hostname)) return false;
  } catch {
    // ignore
  }

  const normalized = connectionString.toLowerCase();
  const knownManaged =
    normalized.includes("supabase.com") ||
    normalized.includes("neon.tech") ||
    normalized.includes("vercel-storage.com");
  if (knownManaged) return true;

  return false;
}

export function createScriptPrismaClient() {
  const runtimeOverride = asValidConnectionString(process.env.DATABASE_RUNTIME_URL);
  const pooled = asValidConnectionString(process.env.DATABASE_URL);
  const direct = asValidConnectionString(process.env.DIRECT_URL);
  const effectiveConnectionString = runtimeOverride || pooled || direct;
  if (!effectiveConnectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set for Prisma scripts.");
  }

  // Keep pg + Prisma in sync on the same sanitized URL.
  process.env.DATABASE_URL = effectiveConnectionString;

  const poolMaxRaw = (process.env.DATABASE_POOL_MAX ?? "").trim();
  const poolMax = poolMaxRaw ? Number(poolMaxRaw) : 2;
  if (!Number.isFinite(poolMax) || poolMax <= 0) {
    throw new Error("DATABASE_POOL_MAX must be a positive number when set.");
  }

  const rejectUnauthorized =
    (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? "").trim().toLowerCase() === "true";

  const pool = new Pool({
    connectionString: effectiveConnectionString,
    ssl: shouldEnableTls(effectiveConnectionString) ? { rejectUnauthorized } : undefined,
    max: poolMax,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 60000,
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: [{ emit: "stdout", level: "error" }, { emit: "stdout", level: "warn" }],
  });
}

