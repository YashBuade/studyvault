"use client";

import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-[rgb(var(--border)/0.7)] bg-[rgb(var(--background))] px-8 py-6 text-sm text-[rgb(var(--text-tertiary))] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2025 StudyVault. Built for students.</p>
        <div className="flex items-center gap-4">
          <Link href="/auth/teacher/login" className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] dark:text-slate-400 dark:hover:text-slate-100">
            Teacher Portal
          </Link>
          <Link href="/auth/admin/login" className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] dark:text-slate-400 dark:hover:text-slate-100">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
