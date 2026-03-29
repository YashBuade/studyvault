"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#spotlight", label: "Spotlight" },
  { href: "/notes", label: "Public Notes" },
  { href: "/#faq", label: "FAQ" },
  { href: "/auth/teacher/login", label: "For Teachers" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.95)] backdrop-blur-xl dark:bg-[rgb(var(--surface-elevated))]/90">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Logo size="sm" />

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-text-secondary))] dark:hover:text-[rgb(var(--color-text-primary))]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/auth/login" className="btn btn-secondary btn-sm">
            Sign in
          </Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm min-h-9">
            Get started
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setOpen((value) => !value)}
          className="icon-button md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))] dark:bg-[rgb(var(--surface-elevated))] md:hidden">
          <div className="page-shell flex flex-col gap-3 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-text-primary))] dark:text-[rgb(var(--color-text-secondary))] dark:hover:bg-[rgb(var(--color-surface-2))] dark:hover:text-[rgb(var(--color-text-primary))]"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--color-bg))] px-3 py-2 dark:bg-[rgb(var(--color-surface))]">
              <span className="text-sm font-medium text-[rgb(var(--color-text-secondary))] dark:text-[rgb(var(--color-text-secondary))]">Theme</span>
              <ThemeToggle />
            </div>
            <Link href="/auth/login" onClick={() => setOpen(false)} className="btn btn-secondary w-full">
              Sign in
            </Link>
            <Link href="/auth/signup" onClick={() => setOpen(false)} className="btn btn-primary w-full">
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
