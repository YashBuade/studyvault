import { prisma } from "@/lib/prisma";

function hasPoolTimeoutMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeMessage = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return maybeMessage.toLowerCase().includes("pool timeout");
}

function hasConnectionTerminatedMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeMessage = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  const normalized = maybeMessage.toLowerCase();
  return (
    normalized.includes("connection terminated unexpectedly") ||
    normalized.includes("server closed the connection unexpectedly") ||
    normalized.includes("terminating connection") ||
    normalized.includes("connection reset")
  );
}

function hasPrismaPoolCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && String((error as { code?: unknown }).code ?? "") === "P2024";
}

function hasPrismaTransientConnectionCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return code === "P1001" || code === "P1017";
}

export function isTransientDbPoolError(error: unknown) {
  return (
    hasPoolTimeoutMessage(error) ||
    hasConnectionTerminatedMessage(error) ||
    hasPrismaPoolCode(error) ||
    hasPrismaTransientConnectionCode(error)
  );
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
