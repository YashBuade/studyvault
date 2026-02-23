import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getConnectionStrings() {
  const pooled = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;

  if (!pooled && !direct) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set for Prisma.");
  }

  return {
    // Runtime traffic should use pooled URL; fallback to direct URL if needed.
    runtimeUrl: pooled || direct!,
    directUrl: direct || pooled!,
  };
}

function createPrismaClient() {
  const config = getConnectionStrings();
  console.log("[Prisma] Initializing database connection...");
  console.log("[Prisma] Runtime connection:", config.runtimeUrl.replace(/:[^:]*@/, ":****@"));
  console.log("[Prisma] Direct connection:", config.directUrl.replace(/:[^:]*@/, ":****@"));

  const pool = new Pool({
    connectionString: config.runtimeUrl,
    max: 10,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 60000,
  });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: [
      { emit: "stdout", level: "error" },
      { emit: "stdout", level: "warn" },
    ],
  });

  client
    .$connect()
    .then(() => console.log("[Prisma] Database connection established"))
    .catch((err) => console.error("[Prisma] Database connection failed:", err.message));

  return client;
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
