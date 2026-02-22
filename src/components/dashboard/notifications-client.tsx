"use client";

import { useEffect, useState } from "react";
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
          <p className="text-sm font-semibold">Recent activity</p>
          <p className="text-xs text-[var(--muted)]">Likes, comments, and reports will show here.</p>
        </div>
        <Button variant="secondary" onClick={markAllRead}>Mark all read</Button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading notifications...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No notifications yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{item.message}</p>
                <span className="text-xs text-[var(--muted)]">{new Date(item.createdAt).toLocaleDateString()}</span>
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
