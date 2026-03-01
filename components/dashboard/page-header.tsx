type PageHeaderProps = {
  title: string;
  description: string;
  insight?: string;
};

export function PageHeader({ title, description, insight }: PageHeaderProps) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] via-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-5 shadow-[var(--shadow-sm)] md:mb-7 md:p-6">
      <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl dark:bg-sky-500/20" />
      <div className="pointer-events-none absolute right-16 top-8 h-10 w-10 rotate-12 rounded-lg bg-gradient-to-br from-blue-400/35 to-indigo-500/35 shadow-[var(--shadow-sm)]" />
      <div className="pointer-events-none absolute right-8 top-20 h-7 w-7 -rotate-6 rounded-md bg-gradient-to-br from-cyan-300/30 to-blue-500/30 shadow-[var(--shadow-sm)]" />

      <div className="relative">
        <p className="inline-flex rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))]">
          StudyVault Workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-3xl md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-[rgb(var(--text-secondary))] md:text-base">{description}</p>
        {insight ? (
          <p className="mt-4 inline-flex max-w-3xl rounded-full border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))] px-4 py-1.5 text-xs font-medium text-[rgb(var(--text-secondary))]">
            {insight}
          </p>
        ) : null}
      </div>
    </div>
  );
}
