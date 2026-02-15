export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--surface)]/80 ${className}`} />;
}