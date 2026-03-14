"use client";

type Tab = { id: string; label: string };

type TabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-1 dark:border-slate-700 dark:bg-slate-900">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold transition-all duration-[var(--transition-base)] ${
            value === tab.id
              ? "bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] shadow-[var(--shadow-sm)] dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:ring-1 dark:ring-slate-700"
              : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface))] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
