"use client";

import { usePathname } from "next/navigation";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "my-files": "My Files",
  "upload-center": "Upload Center",
  teacher: "Teacher Workspace",
  teachers: "Teacher Verification",
  admin: "Admin Panel",
  review: "Review",
};

function formatSegment(segment: string) {
  if (segmentLabels[segment]) {
    return segmentLabels[segment];
  }

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/dashboard") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const items = segments.map(formatSegment);

  return (
    <div className="mb-4 text-xs text-[rgb(var(--text-tertiary))]">
      {items.map((item, index) => (
        <span key={`${item}-${index}`}>
          {index > 0 ? " > " : ""}
          {item}
        </span>
      ))}
    </div>
  );
}
