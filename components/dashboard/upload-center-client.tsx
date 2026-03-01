"use client";

import { FormEvent, useMemo, useState } from "react";
import { BadgeCheck, Clock3, RotateCcw, Search, Trash2, UploadCloud, XCircle } from "lucide-react";
import { Alert } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { useToast } from "@/src/components/ui/toast-provider";

type UserFile = {
  id: number;
  originalName: string;
  size: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationNotes?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: { id: number; name: string; email: string } | null;
  deletedAt?: string | null;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
  meta?: { hasMore?: boolean; nextCursor?: number | null };
};

type UploadCenterClientProps = {
  initialFiles: UserFile[];
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadCenterClient({ initialFiles }: UploadCenterClientProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [files, setFiles] = useState<UserFile[]>(initialFiles);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "trash">("active");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [cursor, setCursor] = useState<number | null>(initialFiles.at(-1)?.id ?? null);
  const [hasMore, setHasMore] = useState(initialFiles.length >= 10);
  const [fetching, setFetching] = useState(false);
  const [makePublic, setMakePublic] = useState(true);
  const { pushToast } = useToast();

  const visible = useMemo(
    () =>
      files.filter((file) => {
        const matchesSearch = search ? file.originalName.toLowerCase().includes(search.toLowerCase()) : true;
        const inView = view === "trash" ? Boolean(file.deletedAt) : !file.deletedAt;
        return matchesSearch && inView;
      }),
    [files, search, view],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("isPublic", String(makePublic));

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as ApiResponse<UserFile>;

    if (!response.ok || !payload.ok || !payload.data) {
      const detailText =
        typeof payload.error?.details === "object" && payload.error?.details && "details" in payload.error.details
          ? String((payload.error.details as { details?: string }).details || "")
          : typeof payload.error?.details === "string"
            ? payload.error.details
            : "";
      setMessage([payload.error?.message ?? "Upload failed.", detailText].filter(Boolean).join(" | "));
      setLoading(false);
      return;
    }

    setSelectedFile(null);
    setMessage("File uploaded successfully.");
    setMakePublic(true);
    setLoading(false);
    setFiles((prev) => [payload.data!, ...prev]);
    pushToast("Upload complete", "success");
  }

  async function deleteFile() {
    if (!pendingDelete) return;

    const response = await fetch(`/api/files?id=${pendingDelete}`, { method: "DELETE" });
    const payload = (await response.json()) as ApiResponse<{ id: number }>;

    if (!response.ok || !payload.ok) {
      setMessage(payload.error?.message ?? "Delete failed.");
      return;
    }

    setFiles((prev) => prev.map((file) => (file.id === pendingDelete ? { ...file, deletedAt: new Date().toISOString() } : file)));
    setPendingDelete(null);
    pushToast("File moved to trash", "info");
  }

  async function restoreFile(id: number) {
    const response = await fetch("/api/files/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const payload = (await response.json()) as ApiResponse<{ id: number }>;

    if (!response.ok || !payload.ok) {
      setMessage(payload.error?.message ?? "Restore failed.");
      return;
    }

    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, deletedAt: null } : file)));
    pushToast("File restored", "success");
  }

  async function loadMore() {
    if (!hasMore || !cursor) return;

    setFetching(true);
    const response = await fetch(`/api/files?cursor=${cursor}&limit=10&includeDeleted=${view === "trash" ? "true" : "false"}`);
    const payload = (await response.json()) as ApiResponse<UserFile[]>;

    if (!response.ok || !payload.ok || !payload.data) {
      setMessage(payload.error?.message ?? "Could not load more files.");
      setFetching(false);
      return;
    }

    setFiles((prev) => [...prev, ...payload.data!.filter((file) => !prev.some((f) => f.id === file.id))]);
    setHasMore(Boolean(payload.meta?.hasMore));
    setCursor(payload.meta?.nextCursor ?? null);
    setFetching(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.1fr]">
      <Card title="Upload File" description="Upload and organize study assets by file name and size.">
        <form onSubmit={onSubmit}>
          <input
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2.5 text-sm"
          />
          <p className="mt-2 text-xs text-[var(--muted)]">Accepted size: up to 10MB per file.</p>
          <label className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={makePublic}
              onChange={(event) => setMakePublic(event.target.checked)}
              className="h-4 w-4 rounded border border-[rgb(var(--border))]"
            />
            Make this file public (available in the public library)
          </label>
          {message ? <div className="mt-3"><Alert message={message} variant={message.includes("success") ? "success" : "info"} /></div> : null}

          <Button type="submit" loading={loading} className="mt-4">
            <UploadCloud size={16} /> Upload
          </Button>
        </form>
      </Card>

      <Card title="Files" description="Search files, load more, and restore from trash.">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" />
            <Input
              aria-label="Search files"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === "active" ? "primary" : "secondary"} onClick={() => setView("active")}>
              Active
            </Button>
            <Button variant={view === "trash" ? "primary" : "secondary"} onClick={() => setView("trash")}>
              Trash
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {visible.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No files in this view.</p>
          ) : (
            visible.map((file) => (
              <article key={file.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{file.originalName}</p>
                    <p className="text-xs text-[var(--muted)]">{formatBytes(file.size)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {file.verificationStatus === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <BadgeCheck size={12} />
                          Verified by {file.verifiedBy?.name ?? "Teacher"}
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
                    {file.verificationNotes ? <p className="text-xs text-[var(--muted)]">Reviewer note: {file.verificationNotes}</p> : null}
                  </div>
                  {view === "trash" ? (
                    <Button variant="secondary" onClick={() => restoreFile(file.id)}>
                      <RotateCcw size={14} /> Restore
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/files/${file.id}/download`}
                        className="rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2 text-xs font-semibold hover:-translate-y-0.5"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(file.id)}
                        className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/50 hover:text-red-500"
                        aria-label="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        {hasMore ? (
          <div className="mt-4">
            <Button variant="secondary" loading={fetching} onClick={loadMore}>
              Load More
            </Button>
          </div>
        ) : null}
      </Card>

      <Modal
        open={pendingDelete !== null}
        title="Delete file"
        description="This file will move to trash and can be restored later."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteFile}
        confirmLabel="Move to Trash"
        danger
      />
    </div>
  );
}
