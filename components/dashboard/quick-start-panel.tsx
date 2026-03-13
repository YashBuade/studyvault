"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function QuickStartPanel() {
  const pathname = usePathname();

  if (pathname !== "/dashboard") {
    return null;
  }

  return (
    <section className="panel-shell mb-5 rounded-[var(--radius-xl)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[rgb(var(--text-tertiary))]">Quick Start</p>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Core actions most students complete every week.</p>
        </div>
        <div className="section-kicker">Fast path</div>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/notes" className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]">1. Capture notes</Link>
        <Link href="/dashboard/upload-center" className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]">2. Upload files</Link>
        <Link href="/dashboard/planner" className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]">3. Plan your week</Link>
        <Link href="/notes" className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]">4. Explore public library</Link>
      </div>
    </section>
  );
}
