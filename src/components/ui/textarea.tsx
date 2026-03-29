import { forwardRef } from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[rgb(var(--text-tertiary))] placeholder:opacity-80 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary)/0.35)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-2))] dark:text-[rgb(var(--text-primary))] dark:placeholder:text-[rgb(var(--text-tertiary))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))] dark:focus-visible:ring-[rgb(var(--primary)/0.25)] ${className}`}
      {...props}
    />
  );
});
