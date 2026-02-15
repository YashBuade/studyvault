import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand)] text-white shadow-[var(--shadow)] hover:bg-[var(--brand-strong)] hover:-translate-y-0.5 focus-visible:ring-[var(--brand)]/40",
  secondary:
    "bg-[var(--panel)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] hover:-translate-y-0.5 focus-visible:ring-[var(--brand)]/30",
  danger:
    "bg-[var(--danger)] text-white shadow-[var(--shadow)] hover:bg-[var(--danger-strong)] hover:-translate-y-0.5 focus-visible:ring-[var(--danger)]/40",
  ghost: "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] focus-visible:ring-[var(--brand)]/30",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-60 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
      {children}
    </button>
  );
});
