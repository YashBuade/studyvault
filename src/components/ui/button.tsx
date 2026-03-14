import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[rgb(var(--primary))] text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] hover:bg-[rgb(var(--primary-hover))] hover:shadow-[var(--shadow-md)] focus-visible:ring-[rgb(var(--primary))]/35 dark:shadow-none dark:ring-1 dark:ring-slate-700",
  secondary:
    "border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-hover))] hover:bg-[rgb(var(--background))] hover:shadow-[var(--shadow-xs)] focus-visible:ring-[rgb(var(--primary))]/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-900 dark:hover:shadow-none dark:ring-1 dark:ring-slate-700",
  danger:
    "bg-[rgb(var(--error))] text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] hover:bg-[rgb(var(--error))]/90 hover:shadow-[var(--shadow-md)] focus-visible:ring-[rgb(var(--error))]/35 dark:shadow-none dark:ring-1 dark:ring-slate-700",
  ghost:
    "bg-transparent text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-soft))] hover:text-[rgb(var(--primary-hover))] focus-visible:ring-[rgb(var(--primary))]/30 dark:text-indigo-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-2 text-sm font-semibold tracking-[0.01em] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))] disabled:cursor-not-allowed disabled:opacity-60 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
      {children}
    </button>
  );
});
