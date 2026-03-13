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

const navSections = [
  {
    label: "Core",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Gauge },
      { href: "/dashboard/notes", label: "Notes", icon: FileText },
      { href: "/dashboard/my-files", label: "My Files", icon: FolderOpen },
      { href: "/dashboard/upload-center", label: "Upload Center", icon: Upload },
    ],
  },
  {
    label: "Study Planning",
    items: [
      { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/dashboard/planner", label: "Planner", icon: Calendar },
      { href: "/dashboard/exams", label: "Exams", icon: GraduationCap },
      { href: "/dashboard/resources", label: "Resources", icon: Library },
    ],
  },
  {
    label: "Explore & Account",
    items: [
      { href: "/notes", label: "Public Library", icon: Globe },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/profile", label: "Profile", icon: User },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/trash", label: "Trash", icon: Archive },
    ],
  },
] as const;

export function DashboardSidebar({
  isAdmin,
  isTeacher,
  teacherStatus,
  isVerifiedTeacher,
}: {
  isAdmin: boolean;
  isTeacher: boolean;
  teacherStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  isVerifiedTeacher: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const adminSections = isAdmin
    ? [
        {
          label: "Admin Control",
          items: [
            { href: "/dashboard/admin", label: "Admin Panel", icon: Shield },
            { href: "/admin/analytics", label: "Admin Analytics", icon: BarChart3 },
          ],
        },
        {
          label: "Admin Verification",
          items: [
            { href: "/dashboard/admin/teachers", label: "Teacher Verification", icon: User },
            { href: "/dashboard/teacher/review", label: "File Verification Queue", icon: Shield },
          ],
        },
      ]
    : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="panel-shell fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-[var(--radius-md)] p-2 text-[rgb(var(--text-primary))] md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {open ? <div className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-[rgb(var(--border))]/70 bg-[rgb(var(--surface))]/90 p-5 backdrop-blur-2xl transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:block`}
      >
        <div className="mb-6 rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/60 bg-gradient-to-br from-[rgb(var(--surface))] via-[rgb(var(--surface-hover))] to-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
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
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">Workspace</p>
              <p className="mt-1 font-semibold text-[rgb(var(--text-primary))]">Unified study hub</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--primary-hover))]">Focus</p>
              <p className="mt-1 font-semibold text-[rgb(var(--text-primary))]">Keep every deadline visible</p>
            </div>
          </div>
        </div>

        <nav className="space-y-4">
          {[...navSections, ...adminSections].map((section) => (
            <div key={section.label} className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/55 bg-[rgb(var(--surface))]/72 p-3 shadow-[var(--shadow-xs)]">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))]">
                {section.label}
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => {
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
              </div>
            </div>
          ))}
        </nav>

        {isTeacher ? (
          <div className="mt-4 rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/60 bg-gradient-to-br from-[rgb(var(--surface-hover))] to-[rgb(var(--surface))] p-3 shadow-[var(--shadow-xs)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-tertiary))]">Teacher</p>
            <div className="mt-2">
              <NavItem href="/dashboard/teacher" active={pathname === "/dashboard/teacher"}>
                <User size={16} />
                Teacher Workspace
              </NavItem>
              <NavItem href="/dashboard/teacher/review" active={pathname === "/dashboard/teacher/review"}>
                <Shield size={16} />
                {isVerifiedTeacher ? "File Verification" : "Verification Pending"}
              </NavItem>
              <p className="mt-2 text-[11px] text-[rgb(var(--text-tertiary))]">Status: {teacherStatus}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-[var(--radius-xl)] border border-[rgb(var(--primary))]/18 bg-gradient-to-br from-[rgb(var(--primary-soft))] to-[rgb(var(--surface))] p-4 text-xs leading-relaxed text-[rgb(var(--text-secondary))] shadow-[var(--shadow-xs)]">
          Build stronger routines with organized notes, timed deadlines, and one searchable study hub.
        </div>
      </aside>
    </>
  );
}
