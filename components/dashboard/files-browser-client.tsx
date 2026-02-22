"use client";

import { useMemo, useState } from "react";
import { Pencil, Search } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { useToast } from "@/src/components/ui/toast-provider";

type UserFile = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  deletedAt: string | null;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  meta?: { hasMore?: boolean; nextCursor?: number | null };
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesBrowserClient({ initialFiles }: { initialFiles: UserFile[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<number | null>(initialFiles.at(-1)?.id ?? null);
  const [hasMore, setHasMore] = useState(initialFiles.length >= 10);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<UserFile | null>(null);
  const [editName, setEditName] = useState("");
  const { pushToast } = useToast();

  const visible = useMemo(
    () => files.filter((file) => !file.deletedAt && file.originalName.toLowerCase().includes(search.toLowerCase())),
    [files, search],
  );

  async function loadMore() {
    if (!cursor || !hasMore) return;

    setLoading(true);
    const response = await fetch(`/api/files?cursor=${cursor}&limit=10`);
    const payload = (await response.json()) as ApiResponse<UserFile[]>;

    if (response.ok && payload.ok && payload.data) {
      setFiles((prev) => [...prev, ...payload.data!.filter((file) => !prev.some((entry) => entry.id === file.id))]);
      setHasMore(Boolean(payload.meta?.hasMore));
      setCursor(payload.meta?.nextCursor ?? null);
    }

    setLoading(false);
  }

  function startEdit(file: UserFile) {
    setEditing(file);
    setEditName(file.originalName);
  }

  async function updateFile() {
    if (!editing) return;
    const response = await fetch("/api/files", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, originalName: editName }),
    });

    const payload = (await response.json()) as ApiResponse<UserFile>;
    if (response.ok && payload.ok && payload.data) {
      setFiles((prev) => prev.map((entry) => (entry.id === editing.id ? payload.data! : entry)));
      setEditing(null);
      pushToast("File renamed", "success");
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files" className="pl-9" />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No files uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((file) => (
            <article
              key={file.id}
              className="flex flex-col gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">{file.originalName}</p>
                <p className="text-xs text-[var(--muted)]">{file.mimeType} - {formatBytes(file.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => startEdit(file)}>
                  <Pencil size={14} /> Rename
                </Button>
                <a
                  href={`/api/files/${file.id}/download`}
                  className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2 text-sm font-medium hover:-translate-y-0.5 hover:shadow-sm"
                >
                  Download
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-4">
          <Button variant="secondary" loading={loading} onClick={loadMore}>
            Load More
          </Button>
        </div>
      ) : null}

      <Modal
        open={editing !== null}
        title="Rename file"
        description="Update the display name for this file."
        onClose={() => setEditing(null)}
        onConfirm={updateFile}
        confirmLabel="Save changes"
      >
        <Input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="File name" />
      </Modal>
    </Card>
  );
}
