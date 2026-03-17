"use client";

import Link from "next/link";
import { Calendar, FileText, FolderOpen, Grid2x2, MoreHorizontal, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Grid2x2 },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/my-files", label: "Files", icon: FolderOpen },
  { href: "/dashboard/planner", label: "Planner", icon: Calendar },
];

const moreLinks = [
  { href: "/dashboard/assignments", label: "Assignments" },
  { href: "/dashboard/exams", label: "Exams" },
  { href: "/notes", label: "Public Notes" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 bg-[rgb(15_23_42_/_0.35)] md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      ) : null}

      {open ? (
        <div className="fixed inset-x-4 bottom-24 z-50 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-lg)] dark:border-slate-700 dark:bg-slate-900 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">More</p>
            <button type="button" aria-label="Close more menu" className="icon-button" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-2">
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.98)] px-2 py-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[11px] font-medium ${
                  active
                    ? "bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))] dark:bg-indigo-950/60 dark:text-indigo-200"
                    : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            aria-label="Open more navigation"
            onClick={() => setOpen(true)}
            className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[11px] font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            <MoreHorizontal size={18} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
