"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/src/components/ui/card";
import { useToast } from "@/src/components/ui/toast-provider";

type PublicUser = {
  id: number;
  name: string;
  avatarUrl?: string | null;
  notes: {
    id: number;
    title: string;
    slug: string;
    subject?: string | null;
    semester?: string | null;
    tags?: string | null;
    createdAt: string;
  }[];
};

type ApiResponse<T> = { ok: boolean; data?: T; error?: { message: string } };

export function PublicProfileClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/public/users/${userId}`);
      const payload = (await response.json()) as ApiResponse<PublicUser>;
      if (response.ok && payload.ok && payload.data) {
        setUser(payload.data);
      } else {
        pushToast(payload.error?.message ?? "Unable to load profile", "error");
      }
    }
    void load();
  }, [userId, pushToast]);

  if (!user) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">Loading profile...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-2xl border border-[rgb(var(--border))] object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-lg font-semibold">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-xs text-[var(--muted)]">{user.notes.length} public notes</p>
          </div>
        </div>
      </Card>

      {user.notes.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">No public notes yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.notes.map((note) => (
            <Card key={note.id}>
              <p className="text-sm font-semibold">{note.title}</p>
              <div className="mt-2 text-xs text-[var(--muted)]">
                {note.subject ? <span>Subject: {note.subject} </span> : null}
                {note.semester ? <span>Semester: {note.semester} </span> : null}
              </div>
              {note.tags ? <p className="mt-2 text-xs text-[var(--muted)]">Tags: {note.tags}</p> : null}
              <Link href={`/notes/${note.slug}`} className="mt-3 inline-flex text-sm font-semibold text-[var(--brand)] hover:underline">
                Open note
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
