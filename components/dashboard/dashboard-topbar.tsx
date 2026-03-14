"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/notes": "My Notes",
  "/dashboard/my-files": "My Files",
  "/dashboard/planner": "Planner",
  "/dashboard/assignments": "Assignments",
  "/dashboard/exams": "Exams",
  "/dashboard/resources": "Resources",
  "/dashboard/upload-center": "Upload Center",
  "/dashboard/notifications": "Notifications",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/analytics": "Analytics",
  "/dashboard/trash": "Trash",
  "/dashboard/teacher": "Teacher Workspace",
  "/dashboard/teacher/review": "Verification Queue",
  "/dashboard/admin": "Admin Panel",
  "/dashboard/admin/teachers": "Teacher Approvals",
};

function getInitials(nameOrEmail: string) {
  return nameOrEmail
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardTopbar({
  name,
  email,
}: {
  name: string | null;
  email: string;
}) {
  const pathname = usePathname();
  const pageTitle = titleMap[pathname] ?? "StudyVault";
  const displayName = name || email;

  return (
    <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/96 backdrop-blur-xl">
      <div className="flex min-h-14 items-center gap-3 px-4 py-3 sm:px-6 md:px-8">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold text-[rgb(var(--text-primary))]">{pageTitle}</h2>
        </div>

        <button
          type="button"
          className="hidden h-9 w-full max-w-[360px] items-center gap-3 rounded-[var(--radius-full)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-4 text-left text-sm text-[rgb(var(--text-tertiary))] shadow-[var(--shadow-xs)] lg:inline-flex"
          aria-label="Search notes, files, and tasks"
        >
          <Search size={16} />
          <span className="flex-1">Search notes, files, tasks...</span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--text-secondary))]">
            Ctrl+K
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/notifications"
            aria-label="Open notifications"
            className="icon-button relative border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)]"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[rgb(var(--color-danger))]" />
          </Link>
          <ThemeToggle />
          <div className="hidden items-center gap-3 rounded-[var(--radius-full)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-1 shadow-[var(--shadow-xs)] sm:flex">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--primary))] text-xs font-semibold text-[rgb(var(--text-inverse))]">
              {getInitials(displayName)}
            </div>
            <div className="max-w-[160px]">
              <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{displayName}</p>
              <p className="truncate text-xs text-[rgb(var(--text-tertiary))]">{email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
