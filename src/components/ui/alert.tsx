"use client";

type AlertProps = {
  variant?: "info" | "success" | "error";
  message: string;
};

const styles: Record<NonNullable<AlertProps["variant"]>, string> = {
  info: "border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))] text-[rgb(var(--text-primary))]",
  success: "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]",
  error: "border-[rgb(var(--error))]/30 bg-[rgb(var(--error))]/10 text-[rgb(var(--error))]",
};

export function Alert({ variant = "info", message }: AlertProps) {
  return <div className={`rounded-xl border px-3 py-2 text-sm ${styles[variant]}`}>{message}</div>;
}
