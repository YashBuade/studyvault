import { forwardRef } from "react";

type Option = { label: string; value: string };

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Option[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, className = "", ...props },
  ref,
) {
  return (
    <label className="block text-sm text-[var(--muted)]">
      {label ? <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">{label}</span> : null}
      <select
        ref={ref}
        className={`w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/35 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
});
