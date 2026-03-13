type CardProps = {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, description, className = "", children }: CardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/95 p-4 shadow-[var(--shadow-md)] transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:border-[rgb(var(--primary))]/20 hover:shadow-[var(--shadow-hover)] sm:p-5 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--primary))]/70 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[rgb(var(--primary-light))]/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_40%)]" />
      {title || description ? (
        <div className="relative mb-4 border-b border-[rgb(var(--border))]/70 pb-4">
          {title ? <h2 className="text-lg font-semibold tracking-tight text-[rgb(var(--text-primary))]">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{description}</p> : null}
        </div>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}
