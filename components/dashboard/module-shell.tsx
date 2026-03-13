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
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-gradient-to-br from-[rgb(var(--surface-elevated))] via-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-5 shadow-[var(--shadow-md)]">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -left-10 top-6 h-28 w-28 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/15" />
        <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/15" />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative">
            <p className="inline-flex rounded-full border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--primary-hover))]">
              How To Use This Module
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{summary}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {checklist.map((item, index) => (
                <div
                  key={`${index}-${item}`}
                  className="rounded-[var(--radius-md)] border border-[rgb(var(--border))]/70 bg-[rgb(var(--surface))]/85 px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)]"
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
                <div key={metric.label} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/75 bg-[rgb(var(--surface))]/88 px-4 py-3 shadow-[var(--shadow-sm)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-primary))]">{metric.value}</p>
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
