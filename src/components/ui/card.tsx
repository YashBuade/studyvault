type CardProps = {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, description, className = "", children }: CardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:border-[rgb(var(--border-hover))] hover:shadow-[var(--shadow-md)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:ring-1 dark:ring-slate-700 dark:hover:border-slate-600 dark:hover:shadow-none sm:p-5 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--primary))]/40 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[rgb(var(--primary-light))]/35 blur-3xl" />
      {title || description ? (
        <div className="relative mb-4 border-b border-[rgb(var(--border))] pb-4 dark:border-slate-700">
          {title ? <h2 className="text-lg font-semibold tracking-tight text-[rgb(var(--text-primary))] dark:text-slate-100">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--text-secondary))] dark:text-slate-300">{description}</p> : null}
        </div>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}
