export function logInfo(scope: string, payload?: Record<string, unknown>) {
  console.info(`[studyvault] ${scope}`, payload ?? {});
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    const anyError = error as Error & { code?: unknown; cause?: unknown };
    return {
      name: error.name,
      message: error.message,
      code: anyError.code ? String(anyError.code) : undefined,
      stack: error.stack,
      cause: anyError.cause ? String(anyError.cause) : undefined,
    };
  }

  if (error && typeof error === "object") {
    const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : undefined;
    const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : undefined;
    return { name: "NonErrorThrow", message: message || "Unknown error", code };
  }

  return { name: "UnknownError", message: String(error ?? "Unknown error") };
}

export function logError(scope: string, error: unknown, payload?: Record<string, unknown>) {
  console.error(`[studyvault] ${scope}`, {
    ...(payload ?? {}),
    error: normalizeError(error),
  });
}
