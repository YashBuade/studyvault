"use client";

import { Bell } from "lucide-react";

export function NotificationBadge() {
  return (
    <span className="relative inline-flex">
      <Bell size={16} />
      <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500" />
    </span>
  );
}
