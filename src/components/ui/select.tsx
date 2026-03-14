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
    <label className="block text-sm text-[rgb(var(--text-secondary))] dark:text-slate-300">
      {label ? <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] dark:text-slate-400">{label}</span> : null}
      <select
        ref={ref}
        className={`w-full rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 text-sm text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:border-[rgb(var(--border-focus))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:ring-1 dark:ring-slate-700 dark:focus-visible:border-indigo-400 dark:focus-visible:ring-indigo-400/25 ${className}`}
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
