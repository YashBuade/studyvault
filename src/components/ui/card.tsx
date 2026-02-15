type CardProps = {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, description, className = "", children }: CardProps) {
  return (
    <section className={`rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)] transition-transform transition-shadow hover:-translate-y-0.5 ${className}`}>
      {title ? <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
