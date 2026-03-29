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
    <label className="block text-sm text-[rgb(var(--text-secondary))]">
      {label ? <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">{label}</span> : null}
      <select
        ref={ref}
        className={`w-full rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 text-sm text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:border-[rgb(var(--border-focus))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary)/0.20)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface))] dark:text-[rgb(var(--text-primary))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))] dark:focus-visible:border-[rgb(var(--border-focus))] dark:focus-visible:ring-[rgb(var(--primary)/0.25)] ${className}`}
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
