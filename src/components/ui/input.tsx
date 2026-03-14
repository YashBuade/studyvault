import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] shadow-[var(--shadow-xs)] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:border-[rgb(var(--border-focus))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:shadow-none dark:ring-1 dark:ring-slate-700 dark:focus-visible:border-indigo-400 dark:focus-visible:ring-indigo-400/25 ${className}`}
      {...props}
    />
  );
});
