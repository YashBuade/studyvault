import { forwardRef } from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/80 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:shadow-none dark:ring-1 dark:ring-slate-700 dark:focus-visible:ring-indigo-400/25 ${className}`}
      {...props}
    />
  );
});
