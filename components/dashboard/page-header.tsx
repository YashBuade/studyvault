type PageHeaderProps = {
  title: string;
  description: string;
  insight?: string;
};

export function PageHeader({ title, description, insight }: PageHeaderProps) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-[var(--radius-xl)] border border-[rgb(var(--border)/0.8)] bg-gradient-to-br from-[rgb(var(--surface-elevated))] via-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-5 shadow-[var(--shadow-md)] dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-700 md:mb-7 md:p-6">
      <div className="hero-grid absolute inset-0 opacity-45" />
      <div className="pointer-events-none absolute -left-16 top-8 h-36 w-36 rounded-full bg-[rgb(var(--color-success)/0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -top-8 h-32 w-32 rounded-full bg-[rgb(var(--color-info)/0.14)] blur-3xl" />
      <div className="pointer-events-none absolute right-16 top-8 h-10 w-10 rotate-12 rounded-lg bg-[linear-gradient(135deg,rgb(var(--color-warning))_0%,rgb(var(--color-danger))_100%)] opacity-20 shadow-[var(--shadow-sm)]" />
      <div className="pointer-events-none absolute right-8 top-20 h-7 w-7 -rotate-6 rounded-md bg-[linear-gradient(135deg,rgb(var(--color-accent))_0%,rgb(var(--color-info))_100%)] opacity-20 shadow-[var(--shadow-sm)]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
        <p className="inline-flex rounded-full border border-[rgb(var(--primary)/0.35)] bg-[rgb(var(--primary-soft))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--primary-hover))] dark:border-indigo-400/40 dark:bg-indigo-950/70 dark:text-indigo-200">
          StudyVault Workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight line-clamp-2 sm:text-3xl md:text-4xl text-[rgb(var(--text-primary))] dark:text-slate-100">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-[rgb(var(--text-secondary))] dark:text-slate-300 md:text-base">{description}</p>
        </div>
        {insight ? (
          <p className="inline-flex max-w-3xl rounded-full border border-[rgb(var(--primary)/0.3)] bg-[rgb(var(--surface-hover)/0.9)] px-4 py-1.5 text-xs font-semibold text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:ring-1 dark:ring-slate-700">
            {insight}
          </p>
        ) : null}
      </div>
    </div>
  );
}
