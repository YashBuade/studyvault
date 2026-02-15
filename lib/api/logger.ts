export function logInfo(scope: string, payload?: Record<string, unknown>) {
  console.info(`[studyvault] ${scope}`, payload ?? {});
}

export function logError(scope: string, error: unknown, payload?: Record<string, unknown>) {
  console.error(`[studyvault] ${scope}`, {
    ...(payload ?? {}),
    error: error instanceof Error ? error.message : "Unknown error",
  });
}