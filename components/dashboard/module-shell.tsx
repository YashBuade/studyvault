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
      <section className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface-elevated))] via-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-4 shadow-[var(--shadow-md)]">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--primary-hover))]">How To Use This Module</p>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {checklist.map((item, index) => (
                <span
                  key={`${index}-${item}`}
                  className="inline-flex items-center rounded-full border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))] px-3 py-1 text-xs font-semibold text-[rgb(var(--primary-hover))]"
                >
                  {index + 1}. {item}
                </span>
              ))}
            </div>
          </div>
          {highlights.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {highlights.map((metric) => (
                <div key={metric.label} className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">{metric.label}</p>
                  <p className="mt-1 text-lg font-semibold text-[rgb(var(--text-primary))]">{metric.value}</p>
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
