"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
import { NotificationBadge } from "@/components/dashboard/notification-badge";
import { LogoutButton } from "@/components/dashboard/logout-button";

const SIDEBAR_COLLAPSED_KEY = "sv-dashboard-sidebar-collapsed";

const navSections = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Gauge },
      { href: "/dashboard/notes", label: "Notes", icon: FileText },
      { href: "/dashboard/my-files", label: "Files", icon: FolderOpen },
      { href: "/dashboard/planner", label: "Planner", icon: Calendar },
    ],
  },
  {
    label: "Study",
    items: [
      { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/dashboard/exams", label: "Exams", icon: GraduationCap },
      { href: "/dashboard/upload-center", label: "Upload Center", icon: Upload },
      { href: "/dashboard/resources", label: "Resources", icon: Library },
    ],
  },
  {
    label: "Community",
    items: [{ href: "/notes", label: "Public Notes", icon: Globe }],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/notifications", label: "Notifications", icon: NotificationBadge },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/profile", label: "Profile", icon: User },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/trash", label: "Trash", icon: Archive },
    ],
  },
] as const;

function getInitials(nameOrEmail: string) {
  return nameOrEmail
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarUserCard({
  collapsed,
  name,
  email,
}: {
  collapsed: boolean;
  name: string | null;
  email: string;
}) {
  const displayName = name || email;

  return (
    <div className="mt-4 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.55)]">
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--primary))] text-xs font-semibold text-[rgb(var(--text-inverse))]">
          {getInitials(displayName)}
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{displayName}</p>
            <p className="truncate text-xs text-[rgb(var(--text-tertiary))]">{email}</p>
          </div>
        ) : null}
      </div>
      <div className={`mt-3 ${collapsed ? "flex justify-center" : ""}`}>
        <LogoutButton />
      </div>
    </div>
  );
}

export function DashboardSidebar({
  isAdmin,
  isTeacher,
  teacherStatus,
  isVerifiedTeacher,
  name,
  email,
}: {
  isAdmin: boolean;
  isTeacher: boolean;
  teacherStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  isVerifiedTeacher: boolean;
  name: string | null;
  email: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      // Ignore storage failures (privacy mode, restricted environments).
      return false;
    }
  });

  useEffect(() => {
    const width = collapsed ? "5rem" : "18rem";
    document.documentElement.style.setProperty("--sv-dashboard-sidebar-w", width);

    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // Ignore storage failures (privacy mode, restricted environments).
    }
  }, [collapsed]);

  const teacherStatusMap = {
    NONE: { label: "Not submitted", className: "text-[rgb(var(--text-tertiary))]" },
    PENDING: { label: "Awaiting admin approval", className: "text-[rgb(var(--color-warning))]" },
    APPROVED: { label: "Verified \u2713", className: "text-[rgb(var(--color-success))]" },
    REJECTED: { label: "Verification rejected", className: "text-[rgb(var(--color-danger))]" },
  } as const;

  const adminSections = isAdmin
    ? [
        {
          label: "Admin",
          items: [
            { href: "/dashboard/admin", label: "Admin Panel", icon: Shield },
            { href: "/dashboard/admin/teachers", label: "Teacher Approvals", icon: User },
          ],
        },
      ]
    : [];

  const closeSidebar = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="panel-shell fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-[var(--radius-md)] p-2 text-[rgb(var(--text-primary))] ring-1 ring-[rgb(var(--border)/0.55)] md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {open ? <div className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={closeSidebar} aria-hidden="true" /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.92)] backdrop-blur-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20" : "w-72"} md:translate-x-0`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Logo size="md" showText={!collapsed} href="/dashboard" />
            <button
              type="button"
              onClick={closeSidebar}
              className="icon-button border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.55)] md:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="icon-button hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.55)] md:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {!collapsed ? (
            <div className="mb-4 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.55)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))]">Workspace</p>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--text-primary))]">Notes, files, planning, and deadlines in one focused flow.</p>
            </div>
          ) : null}

          <nav className="flex-1 space-y-4 overflow-y-auto">
            {[...navSections, ...adminSections].map((section) => (
              <div key={section.label} className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))]">
                    {section.label}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.href} onClick={closeSidebar}>
                        <NavItem href={item.href} active={pathname === item.href}>
                          <Icon size={18} />
                          {!collapsed ? <span>{item.label}</span> : null}
                        </NavItem>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {isTeacher ? (
            <div className="mt-4 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.55)]">
              {!collapsed ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-tertiary))]">Teacher</p> : null}
              <div className="mt-2 space-y-1">
                <NavItem href="/dashboard/teacher" active={pathname === "/dashboard/teacher"}>
                  <User size={18} />
                  {!collapsed ? <span>Teacher Workspace</span> : null}
                </NavItem>
                <NavItem href="/dashboard/teacher/review" active={pathname === "/dashboard/teacher/review"}>
                  <Shield size={18} />
                  {!collapsed ? <span>{isVerifiedTeacher ? "File Verification" : "Verification Pending"}</span> : null}
                </NavItem>
                {!collapsed ? (
                  <p className={`mt-2 text-[11px] ${teacherStatusMap[teacherStatus].className}`}>{teacherStatusMap[teacherStatus].label}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <SidebarUserCard collapsed={collapsed} name={name} email={email} />
        </div>
      </aside>
    </>
  );
}
