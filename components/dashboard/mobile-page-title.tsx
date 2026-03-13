"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/notes": "Notes",
  "/dashboard/my-files": "My Files",
  "/dashboard/planner": "Planner",
  "/dashboard/assignments": "Assignments",
  "/dashboard/exams": "Exams",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
  "/dashboard/profile": "Profile",
  "/dashboard/trash": "Trash",
  "/dashboard/notifications": "Notifications",
  "/dashboard/resources": "Resources",
  "/dashboard/upload-center": "Upload Center",
  "/dashboard/teacher": "Teacher Workspace",
  "/dashboard/teacher/review": "Review Queue",
  "/dashboard/admin": "Admin Panel",
  "/dashboard/admin/teachers": "Teacher Verification",
};

export function MobilePageTitle() {
  const pathname = usePathname();

  return <p className="text-center text-sm font-bold text-[rgb(var(--text-primary))]">{titles[pathname] ?? "StudyVault"}</p>;
}
