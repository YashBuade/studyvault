export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export function success<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return {
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function failure(code: ApiErrorCode, message: string, details?: unknown): ApiError {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}