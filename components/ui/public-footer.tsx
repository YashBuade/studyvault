"use client";

import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-[rgb(var(--border)/0.7)] bg-[rgb(var(--background))] px-4 py-6 text-sm text-[rgb(var(--text-secondary))] sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2025 StudyVault. Built for students.</p>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/teacher/login"
            className="font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] dark:text-[rgb(var(--text-primary))] dark:opacity-85 dark:hover:opacity-100"
          >
            Teacher Portal
          </Link>
          <Link
            href="/auth/admin/login"
            className="font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] dark:text-[rgb(var(--text-primary))] dark:opacity-85 dark:hover:opacity-100"
          >
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
