"use client";

import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-[rgb(var(--border))]/70 px-8 py-6 text-sm text-[rgb(var(--text-tertiary))]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2025 StudyVault. Built for students.</p>
        <div className="flex items-center gap-4">
          <Link href="/auth/teacher/login" className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]">
            Teacher Portal
          </Link>
          <Link href="/auth/admin/login" className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
