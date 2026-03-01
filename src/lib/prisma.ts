import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const pooled = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;

  const runtimeUrl =
    process.env.DATABASE_RUNTIME_URL ||
    (process.env.NODE_ENV === "development" ? direct || pooled : pooled || direct);

  if (!pooled && runtimeUrl) {
    process.env.DATABASE_URL = runtimeUrl;
  }
  if (!process.env.DATABASE_URL && runtimeUrl) {
    process.env.DATABASE_URL = runtimeUrl;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set for Prisma.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
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
