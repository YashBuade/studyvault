"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Clock3, FileArchive, FileImage, FileText, Pencil, Search, XCircle } from "lucide-react";
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
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationNotes?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: { id: number; name: string; email: string } | null;
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

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("image")) return FileImage;
  return FileArchive;
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
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/60 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
            <FileArchive size={24} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No files yet</h3>
          <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">Upload PDFs, docs, and images so your study files are always easy to find.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((file) => {
            const FileIcon = getFileIcon(file.mimeType);

            return (
            <article
              key={file.id}
              className="flex flex-col gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 transition hover:border-[rgb(var(--primary))]/25 hover:shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
                  <FileIcon size={20} />
                </div>
                <div>
                <p className="text-sm font-medium">{file.originalName}</p>
                <p className="text-xs text-[var(--muted)]">{file.mimeType} - {formatBytes(file.size)}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {file.verificationStatus === "VERIFIED" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <BadgeCheck size={12} />
                      Verified by expert {file.verifiedBy?.name ?? "reviewer"}
                    </span>
                  ) : file.verificationStatus === "REJECTED" ? (
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <XCircle size={12} />
                      Rejected by reviewer
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Clock3 size={12} />
                      Awaiting teacher verification
                    </span>
                  )}
                </p>
                {file.verificationNotes ? <p className="mt-1 text-xs text-[var(--muted)]">Reviewer note: {file.verificationNotes}</p> : null}
                </div>
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
          )})}
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
