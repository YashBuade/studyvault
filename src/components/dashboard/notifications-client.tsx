"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Bell, BellOff, Bookmark, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/toast-provider";

type Notification = {
  id: number;
  type: "LIKE" | "COMMENT" | "BOOKMARK" | "SYSTEM" | string;
  title?: string | null;
  message: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type ApiResponse<T> = { ok: boolean; data?: T };

function formatRelativeDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 2 && diffDays <= 6) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays <= 29) {
    const weeks = Math.round(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const includeYear = now.getFullYear() !== date.getFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function NotificationTypeIcon({ type }: { type: Notification["type"] }) {
  const normalized = (type ?? "").toUpperCase();
  if (normalized === "LIKE") return <Heart className="h-4 w-4 text-pink-500" />;
  if (normalized === "COMMENT") return <MessageCircle className="h-4 w-4 text-blue-500" />;
  if (normalized === "BOOKMARK") return <Bookmark className="h-4 w-4 text-amber-500" />;
  return <Bell className="h-4 w-4 text-slate-500" />;
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[rgb(var(--color-danger-light))] p-2 text-[rgb(var(--error))]">
          <AlertCircle size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Something went wrong</p>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">We couldn&apos;t load this section. Try refreshing.</p>
          <div className="mt-3">
            <Button variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-56 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
                <div className="h-3 w-40 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              </div>
            </div>
            <div className="h-3 w-16 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsClient() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const { pushToast } = useToast();

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/notifications");
      const payload = (await response.json()) as ApiResponse<Notification[]>;
      if (response.ok && payload.ok && payload.data) {
        setItems(payload.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      if (!response.ok) {
        pushToast("Unable to mark all as read", "error");
        return;
      }
      setItems((prev) => prev.map((item) => ({ ...item, readAt: new Date().toISOString() })));
      pushToast("Notifications cleared", "success");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Your workspace</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">Notifications</h1>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-[rgb(var(--primary-soft))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--primary))]">
                {unreadCount} unread
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">New activity on your notes and workspace shows up here.</p>
        </div>
        {unreadCount > 0 ? (
          <Button
            variant="secondary"
            loading={markingAll}
            className="w-full sm:w-auto"
            onClick={markAllRead}
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <ErrorCard onRetry={() => void load()} />
      ) : loading ? (
        <SkeletonList />
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 text-center shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
            <BellOff size={26} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">You&apos;re all caught up</h3>
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">New activity on your notes will appear here.</p>
          <div className="mt-4">
            <Link href="/dashboard/notes" className="inline-flex w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Create a note</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const unread = !item.readAt;
            return (
              <div
                key={item.id}
                className={`rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] ${
                  unread ? "border-l-2 border-l-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--surface))]">
                      <NotificationTypeIcon type={item.type} />
                    </div>
                    <div>
                      <p className={`text-sm ${unread ? "font-semibold" : "font-medium"} text-[rgb(var(--text-primary))]`}>
                        {item.title ?? item.message}
                      </p>
                      {item.title ? (
                        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{item.message}</p>
                      ) : null}
                      {item.link ? (
                        <a
                          href={item.link}
                          className="mt-2 inline-flex text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
                        >
                          Open
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">{formatRelativeDate(item.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
