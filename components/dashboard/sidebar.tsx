"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FolderOpen,
  Gauge,
  Menu,
  Settings,
  Upload,
  User,
  FileText,
  GraduationCap,
  Library,
  X,
  Archive,
} from "lucide-react";
import { NavItem } from "@/src/components/ui/nav-item";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/my-files", label: "My Files", icon: FolderOpen },
  { href: "/dashboard/upload-center", label: "Upload Center", icon: Upload },
  { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/dashboard/planner", label: "Planner", icon: Calendar },
  { href: "/dashboard/resources", label: "Resources", icon: Library },
  { href: "/dashboard/exams", label: "Exams", icon: GraduationCap },
  { href: "/dashboard/trash", label: "Trash", icon: Archive },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] p-2 text-[var(--text)] shadow-[var(--shadow)] md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--border)] bg-[var(--panel)]/96 p-5 backdrop-blur transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:block`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 text-lg font-semibold text-[var(--text)]">
            <div className="rounded-xl bg-[var(--brand-soft)] p-2 text-[var(--brand)] shadow-sm">
              <BookOpen size={18} />
            </div>
            StudyVault
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <div key={item.href} onClick={() => setOpen(false)}>
                <NavItem href={item.href} active={active}>
                  <Icon size={16} />
                  {item.label}
                </NavItem>
              </div>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
          Upload smarter, organize faster, and keep every class resource in one secure place.
        </div>
      </aside>
    </>
  );
}
