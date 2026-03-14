"use client";

type AlertProps = {
  variant?: "info" | "success" | "error";
  message: string;
};

const styles: Record<NonNullable<AlertProps["variant"]>, string> = {
  info: "border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))] text-[rgb(var(--text-primary))] dark:border-indigo-500/30 dark:bg-indigo-900/30 dark:text-slate-100",
  success: "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))] dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300",
  error: "border-[rgb(var(--error))]/30 bg-[rgb(var(--error))]/10 text-[rgb(var(--error))] dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-300",
};

export function Alert({ variant = "info", message }: AlertProps) {
  return <div className={`rounded-xl border px-3 py-2 text-sm ${styles[variant]}`}>{message}</div>;
}
