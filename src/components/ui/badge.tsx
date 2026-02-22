type BadgeProps = {
  variant?: "neutral" | "info" | "danger" | "warning";
  children: React.ReactNode;
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-[rgb(var(--surface))] text-[var(--text)] border-[rgb(var(--border))]",
  info: "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--brand)]/30",
  danger: "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/40",
  warning: "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/40",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${variants[variant]}`}>{children}</span>;
}
