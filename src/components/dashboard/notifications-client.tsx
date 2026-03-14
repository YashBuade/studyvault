"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";

type Notification = {
  id: number;
  type: string;
  message: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type ApiResponse<T> = { ok: boolean; data?: T };

export function NotificationsClient() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/notifications");
      const payload = (await response.json()) as ApiResponse<Notification[]>;
      if (response.ok && payload.ok && payload.data) {
        setItems(payload.data);
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((prev) => prev.map((item) => ({ ...item, readAt: new Date().toISOString() })));
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">Recent activity</p>
          <p className="text-xs text-[var(--muted)] dark:text-slate-400">Likes, comments, and reports will show here.</p>
        </div>
        <Button variant="secondary" onClick={markAllRead}>Mark all read</Button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--muted)] dark:text-slate-400">Loading notifications...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/60 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
              <BellOff size={24} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">No notifications yet</h3>
            <p className="mt-2 max-w-xs text-sm text-[var(--muted)] dark:text-slate-400">Likes, comments, moderation updates, and workspace alerts will appear here when they happen.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 transition hover:border-[rgb(var(--primary))]/25 hover:shadow-[var(--shadow-xs)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:ring-1 dark:ring-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
                    <Bell size={16} />
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))] dark:text-slate-100">{item.message}</p>
                </div>
                <span className="text-xs text-[var(--muted)] dark:text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              {item.link ? (
                <a href={item.link} className="mt-2 inline-flex text-xs font-semibold text-[var(--brand)] hover:underline">
                  Open
                </a>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
