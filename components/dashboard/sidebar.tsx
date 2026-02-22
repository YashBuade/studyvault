"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  BarChart3,
  Bell,
  Calendar,
  ClipboardList,
  FileText,
  FolderOpen,
  Gauge,
  Globe,
  GraduationCap,
  Library,
  Menu,
  Settings,
  Shield,
  Upload,
  User,
  X,
} from "lucide-react";
import { NavItem } from "@/src/components/ui/nav-item";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/my-files", label: "My Files", icon: FolderOpen },
  { href: "/dashboard/upload-center", label: "Upload Center", icon: Upload },
  { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/dashboard/planner", label: "Planner", icon: Calendar },
  { href: "/dashboard/resources", label: "Resources", icon: Library },
  { href: "/dashboard/exams", label: "Exams", icon: GraduationCap },
  { href: "/notes", label: "Public Library", icon: Globe },
  { href: "/dashboard/trash", label: "Trash", icon: Archive },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2 text-[rgb(var(--text-primary))] shadow-[var(--shadow-sm)] md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {open ? <div className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 p-5 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:block`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo size="md" showText href="/dashboard" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[var(--radius-sm)] p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))] md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">Workspace</p>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.href} onClick={() => setOpen(false)}>
                <NavItem href={item.href} active={pathname === item.href}>
                  <Icon size={16} />
                  {item.label}
                </NavItem>
              </div>
            );
          })}
        </nav>

        {isAdmin ? (
          <div className="mt-4 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-tertiary))]">Admin</p>
            <div className="mt-2">
              <NavItem href="/dashboard/admin" active={pathname === "/dashboard/admin"}>
                <Shield size={16} />
                Admin Panel
              </NavItem>
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-[var(--radius-md)] border border-[rgb(var(--primary))]/20 bg-[rgb(var(--primary-soft))] p-4 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
          Build stronger routines with organized notes, timed deadlines, and one searchable study hub.
        </div>
      </aside>
    </>
  );
}
