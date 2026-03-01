type CardProps = {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, description, className = "", children }: CardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all duration-[var(--transition-base)] hover:shadow-[var(--shadow-md)] sm:p-5 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--primary))]/40 to-transparent" />
      {title ? <h2 className="text-lg font-semibold tracking-tight text-[rgb(var(--text-primary))]">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{description}</p> : null}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
