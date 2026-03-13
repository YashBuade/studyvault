"use client";

import Link from "next/link";

export function NavItem({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-all duration-[var(--transition-base)] ${
        active
          ? "border border-[rgb(var(--primary))]/20 bg-gradient-to-r from-[rgb(var(--primary-soft))] via-[rgb(var(--surface))] to-[rgb(var(--surface))] text-[rgb(var(--primary-hover))] shadow-[var(--shadow-xs)]"
          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-2 left-1 w-1 rounded-full transition-all ${
          active ? "bg-[rgb(var(--primary))]" : "bg-transparent group-hover:bg-[rgb(var(--border))]"
        }`}
      />
      <span
        className={`h-2 w-2 rounded-full transition-colors ${
          active ? "bg-[rgb(var(--primary))]" : "bg-[rgb(var(--border))] group-hover:bg-[rgb(var(--primary))]"
        }`}
      />
      {children}
    </Link>
  );
}
