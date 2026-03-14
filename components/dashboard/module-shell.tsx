type ModuleHighlight = {
  label: string;
  value: string;
};

type ModuleShellProps = {
  summary: string;
  checklist: string[];
  highlights?: ModuleHighlight[];
  children: React.ReactNode;
};

export function ModuleShell({ summary, checklist, highlights = [], children }: ModuleShellProps) {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[rgb(var(--border)/0.8)] bg-gradient-to-br from-[rgb(var(--surface-elevated))] via-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-5 shadow-[var(--shadow-md)] dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-700">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -left-10 top-6 h-28 w-28 rounded-full bg-[rgb(var(--color-success)/0.12)] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-[rgb(var(--color-info)/0.12)] blur-3xl" />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative">
            <p className="inline-flex rounded-full border border-[rgb(var(--primary)/0.25)] bg-[rgb(var(--primary-soft))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--primary-hover))] dark:border-indigo-400/35 dark:bg-indigo-950/70 dark:text-indigo-200">
              How To Use This Module
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-secondary))] dark:text-slate-300">{summary}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {checklist.map((item, index) => (
                <div
                  key={`${index}-${item}`}
                  className="rounded-[var(--radius-md)] border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.85)] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)] dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100 dark:shadow-none dark:ring-1 dark:ring-slate-700"
                >
                  <span className="mr-2 text-[rgb(var(--primary))]">{index + 1}.</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          {highlights.length > 0 ? (
            <div className="relative grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {highlights.map((metric) => (
                <div key={metric.label} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.88)] px-4 py-3 shadow-[var(--shadow-sm)] dark:border-slate-700 dark:bg-slate-800/88 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] dark:text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">{metric.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      {children}
    </div>
  );
}
