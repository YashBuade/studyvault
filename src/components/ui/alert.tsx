"use client";

type AlertProps = {
  variant?: "info" | "success" | "error";
  message: string;
};

const styles: Record<NonNullable<AlertProps["variant"]>, string> = {
  info: "border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))] text-[rgb(var(--text-primary))] dark:border-[rgb(var(--primary))]/35 dark:bg-[rgb(var(--primary-light))]/25",
  success: "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))] dark:border-[rgb(var(--success))]/35 dark:bg-[rgb(var(--color-success-light))]/35 dark:text-[rgb(var(--text-primary))]",
  error: "border-[rgb(var(--error))]/30 bg-[rgb(var(--error))]/10 text-[rgb(var(--error))] dark:border-[rgb(var(--error))]/35 dark:bg-[rgb(var(--color-danger-light))]/35 dark:text-[rgb(var(--text-primary))]",
};

export function Alert({ variant = "info", message }: AlertProps) {
  return <div className={`rounded-xl border px-3 py-2 text-sm ${styles[variant]}`}>{message}</div>;
}
