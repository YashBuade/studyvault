import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] shadow-[var(--shadow-xs)] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:border-[rgb(var(--border-focus))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary)/0.20)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface))] dark:text-[rgb(var(--text-primary))] dark:placeholder:text-[rgb(var(--text-tertiary))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))] dark:focus-visible:border-[rgb(var(--border-focus))] dark:focus-visible:ring-[rgb(var(--primary)/0.25)] ${className}`}
      {...props}
    />
  );
});
