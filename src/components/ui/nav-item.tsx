"use client";

import Link from "next/link";

export function NavItem({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-md)] border-l-2 px-3 py-2.5 text-[13px] font-medium transition-all duration-[var(--transition-base)] ${
        active
          ? "border-l-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))] dark:bg-indigo-900/30 dark:text-indigo-300"
          : "border-l-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}
