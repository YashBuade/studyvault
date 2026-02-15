import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)]/80 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/35 ${className}`}
      {...props}
    />
  );
});
