import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[rgb(var(--primary))] text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] hover:bg-[rgb(var(--primary-hover))] hover:shadow-[var(--shadow-lg)] focus-visible:ring-[rgb(var(--primary))]/35",
  secondary:
    "bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-hover))] hover:border-[rgb(var(--primary))]/35 hover:shadow-[var(--shadow-xs)] focus-visible:ring-[rgb(var(--primary))]/30",
  danger:
    "bg-[rgb(var(--error))] text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] hover:opacity-95 hover:shadow-[var(--shadow-md)] focus-visible:ring-[rgb(var(--error))]/35",
  ghost:
    "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))] focus-visible:ring-[rgb(var(--primary))]/30",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold tracking-[0.01em] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] ${variantClass[variant]} ${className}`}
      {...props}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
      {children}
    </button>
  );
});
