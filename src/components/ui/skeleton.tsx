export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[rgb(var(--surface))]/80 ${className}`} />;
}