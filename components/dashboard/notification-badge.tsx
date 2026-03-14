"use client";

import { Bell } from "lucide-react";

export function NotificationBadge({ size = 16 }: { size?: number }) {
  return (
    <span className="relative inline-flex">
      <Bell size={size} />
      <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[rgb(var(--color-danger))]" />
    </span>
  );
}
