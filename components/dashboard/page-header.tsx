type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">StudyVault</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-[var(--muted)] md:text-base">{description}</p>
    </div>
  );
}
