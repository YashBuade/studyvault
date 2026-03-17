import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

type SslPreference = "auto" | "require" | "disable";

function asValidConnectionString(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const unquoted = trimmed.replace(/^['"]|['"]$/g, "").trim();
  if (!unquoted) return undefined;
  if (unquoted.includes("${")) return undefined;
  if (!unquoted.startsWith("postgresql://") && !unquoted.startsWith("postgres://")) return undefined;
  return unquoted;
}

function isLocalHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function parseSslPreference(value: string | undefined): SslPreference {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "auto") return "auto";
  if (normalized === "1" || normalized === "true" || normalized === "require") return "require";
  if (normalized === "0" || normalized === "false" || normalized === "disable") return "disable";
  throw new Error('Invalid DATABASE_SSL value. Use "auto", "require", or "disable".');
}

function inferSslFromConnectionString(connectionString: string): boolean | undefined {
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

function shouldEnableTls(connectionString: string) {
  const explicitPreference = parseSslPreference(process.env.DATABASE_SSL);
  if (explicitPreference === "require") return true;
  if (explicitPreference === "disable") return false;

  const fromUrl = inferSslFromConnectionString(connectionString);
  if (typeof fromUrl === "boolean") return fromUrl;

  const normalized = connectionString.toLowerCase();
  const knownManaged = normalized.includes("supabase.com") || normalized.includes("neon.tech") || normalized.includes("vercel-storage.com");
  if (knownManaged) return true;

  try {
    const url = new URL(connectionString);
    if (process.env.NODE_ENV === "production" && !isLocalHostname(url.hostname)) {
      return true;
    }
  } catch {
    // If URL parsing fails, fall back to a conservative default (no forced TLS).
  }

  return false;
}

function assertNoInvalidEnvUrl(name: string, value: string | undefined) {
  if (!value) return;
  if (asValidConnectionString(value)) return;
  throw new Error(`${name} is set but is not a valid PostgreSQL connection string (must start with postgresql://).`);
}

function createPrismaClient() {
  assertNoInvalidEnvUrl("DATABASE_URL", process.env.DATABASE_URL);
  assertNoInvalidEnvUrl("DIRECT_URL", process.env.DIRECT_URL);
  assertNoInvalidEnvUrl("DATABASE_RUNTIME_URL", process.env.DATABASE_RUNTIME_URL);

  const pooled = asValidConnectionString(process.env.DATABASE_URL);
  const direct = asValidConnectionString(process.env.DIRECT_URL);
  const runtimeOverride = asValidConnectionString(process.env.DATABASE_RUNTIME_URL);
  const runtimeUrl = runtimeOverride || pooled || direct;

  if (runtimeUrl && !asValidConnectionString(process.env.DATABASE_URL)) {
    process.env.DATABASE_URL = runtimeUrl;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set for Prisma.");
  }

  const poolMaxRaw = (process.env.DATABASE_POOL_MAX ?? "").trim();
  const defaultPoolMax = process.env.NODE_ENV === "production" ? 5 : 10;
  const poolMax = poolMaxRaw ? Number(poolMaxRaw) : defaultPoolMax;
  if (!Number.isFinite(poolMax) || poolMax <= 0) {
    throw new Error("DATABASE_POOL_MAX must be a positive number when set.");
  }

  const rejectUnauthorized =
    (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? "").trim().toLowerCase() === "true";

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: shouldEnableTls(process.env.DATABASE_URL)
      ? { rejectUnauthorized }
      : undefined,
    max: poolMax,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 60000,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: [{ emit: "stdout", level: "error" }, { emit: "stdout", level: "warn" }],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
