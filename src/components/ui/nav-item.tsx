"use client";

import Link from "next/link";

export function NavItem({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-[var(--brand)] text-white shadow-[var(--shadow)]"
          : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : "bg-[var(--border)] group-hover:bg-[var(--brand)]"}`} />
      {children}
    </Link>
  );
}
