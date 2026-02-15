"use client";

type AlertProps = {
  variant?: "info" | "success" | "error";
  message: string;
};

const styles: Record<NonNullable<AlertProps["variant"]>, string> = {
  info: "border-[var(--brand)]/30 bg-[var(--brand-soft)]/35 text-[var(--text)]",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  error: "border-[var(--danger)]/35 bg-[var(--danger)]/12 text-[var(--danger)]",
};

export function Alert({ variant = "info", message }: AlertProps) {
  return <div className={`rounded-xl border px-3 py-2 text-sm ${styles[variant]}`}>{message}</div>;
}
