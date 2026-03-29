type BadgeProps = {
  variant?: "neutral" | "info" | "danger" | "warning";
  children: React.ReactNode;
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] border-[rgb(var(--border))]",
  info: "bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))] border-[rgb(var(--primary)/0.30)]",
  danger: "bg-[rgb(var(--error)/0.12)] text-[rgb(var(--error))] border-[rgb(var(--error)/0.35)]",
  warning: "bg-[rgb(var(--warning)/0.12)] text-[rgb(var(--warning))] border-[rgb(var(--warning)/0.35)]",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${variants[variant]}`}>{children}</span>;
}
