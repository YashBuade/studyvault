import { prisma } from "@/lib/prisma";

function hasPoolTimeoutMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeMessage = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return maybeMessage.toLowerCase().includes("pool timeout");
}

function hasPrismaPoolCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && String((error as { code?: unknown }).code ?? "") === "P2024";
}

export function isTransientDbPoolError(error: unknown) {
  return hasPoolTimeoutMessage(error) || hasPrismaPoolCode(error);
}

export async function withDbRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientDbPoolError(error)) {
      throw error;
    }

    await prisma.$disconnect().catch(() => undefined);
    await prisma.$connect();
    return operation();
  }
}
