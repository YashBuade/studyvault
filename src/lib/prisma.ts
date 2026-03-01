import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const pooled = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;
  if (!pooled && direct) {
    process.env.DATABASE_URL = direct;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set for Prisma.");
  }

  return new PrismaClient({
    log: [{ emit: "stdout", level: "error" }, { emit: "stdout", level: "warn" }],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
