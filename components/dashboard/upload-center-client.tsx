"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { BadgeCheck, CheckCircle2, Clock3, RotateCcw, Search, Trash2, Upload, UploadCloud, X, XCircle } from "lucide-react";
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

type UploadItem = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "success" | "error";
  progress: number | null;
  message?: string;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function createUploadId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`;
}

export function UploadCenterClient({ initialFiles }: UploadCenterClientProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UserFile[]>(initialFiles);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "trash">("active");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [cursor, setCursor] = useState<number | null>(initialFiles.at(-1)?.id ?? null);
  const [hasMore, setHasMore] = useState(initialFiles.length >= 10);
  const [fetching, setFetching] = useState(false);
  const [makePublic, setMakePublic] = useState(true);
  const { pushToast } = useToast();
  const uploadLimitMb = Number(process.env.NEXT_PUBLIC_FILE_UPLOAD_MAX_MB ?? 20);
  const uploadLimitBytes = Math.max(1, Math.min(uploadLimitMb, 100)) * 1024 * 1024;

  const visible = useMemo(
    () =>
      files.filter((file) => {
        const matchesSearch = search ? file.originalName.toLowerCase().includes(search.toLowerCase()) : true;
        const inView = view === "trash" ? Boolean(file.deletedAt) : !file.deletedAt;
        return matchesSearch && inView;
      }),
    [files, search, view],
  );
  const activeCount = files.filter((file) => !file.deletedAt).length;
  const trashCount = files.filter((file) => Boolean(file.deletedAt)).length;

  function addFiles(incoming: File[]) {
    if (incoming.length === 0) return;

    setMessage("");
    setUploads((prev) => {
      const next = [...prev];
      incoming.forEach((file) => {
        const tooLarge = file.size > uploadLimitBytes;
        next.unshift({
          id: createUploadId(file),
          file,
          status: tooLarge ? "error" : "queued",
          progress: null,
          message: tooLarge ? `Exceeds ${Math.round(uploadLimitBytes / (1024 * 1024))}MB limit.` : undefined,
        });
      });
      return next;
    });
  }

  function removeUpload(id: string) {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }

  function setUploadProgress(id: string, progress: number | null) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress } : u)));
  }

  function setUploadStatus(id: string, status: UploadItem["status"], message?: string) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status, message } : u)));
  }

  function uploadWithProgress(file: File, id: string) {
    return new Promise<{ ok: boolean; data?: UserFile; errorMessage?: string }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files/upload");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          setUploadProgress(id, null);
          return;
        }
        const pct = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        setUploadProgress(id, pct);
      };

      xhr.onerror = () => resolve({ ok: false, errorMessage: "Unable to reach upload service. Please retry." });

      xhr.onload = () => {
        const raw = xhr.responseText;
        let payload: ApiResponse<UserFile> | null = null;
        try {
          payload = raw ? (JSON.parse(raw) as ApiResponse<UserFile>) : null;
        } catch {
          payload = null;
        }

        if (xhr.status >= 200 && xhr.status < 300 && payload?.ok && payload.data) {
          resolve({ ok: true, data: payload.data });
          return;
        }

        const fallback =
          xhr.status === 413
            ? "Upload payload too large for deployment function. Use a smaller file."
            : xhr.status >= 500
              ? `Server error (${xhr.status}).`
              : `Request failed (${xhr.status}).`;

        resolve({ ok: false, errorMessage: payload?.error?.message ?? fallback });
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("isPublic", String(makePublic));
      xhr.send(formData);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const queued = uploads.filter((u) => u.status === "queued");
    if (queued.length === 0) {
      setMessage("Drag files into the upload box or click to browse.");
      return;
    }

    setUploading(true);
    setMessage("");

    for (const upload of queued) {
      setUploadStatus(upload.id, "uploading");
      setUploadProgress(upload.id, 0);

      const result = await uploadWithProgress(upload.file, upload.id);
      if (result.ok && result.data) {
        setUploadStatus(upload.id, "success", "Uploaded successfully");
        setUploadProgress(upload.id, 100);
        setFiles((prev) => [result.data!, ...prev]);
        pushToast("Upload complete", "success");
      } else {
        setUploadStatus(upload.id, "error", result.errorMessage ?? "Upload failed");
      }
    }

    setUploading(false);
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
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDragging(false);
              addFiles(Array.from(event.dataTransfer.files ?? []));
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed px-5 py-10 text-center transition ${
              isDragging
                ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--primary))]/35 hover:bg-[rgb(var(--surface-hover))]"
            }`}
          >
            <Upload className="h-10 w-10 text-[rgb(var(--primary))]" />
            <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))]">Drag files here or click to browse</p>
            <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">PDF, Word, Excel, images up to {uploadLimitMb}MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.gif,.svg"
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                addFiles(selected);
                event.currentTarget.value = "";
              }}
              className="sr-only"
            />
          </div>

          <p className="mt-2 text-xs text-[rgb(var(--text-tertiary))]">Accepted size: up to {uploadLimitMb}MB per file.</p>

          <label className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={makePublic}
              onChange={(event) => setMakePublic(event.target.checked)}
              className="h-4 w-4 rounded border border-[rgb(var(--border))]"
            />
            Make this file public (available in the public library)
          </label>

          {uploads.length > 0 ? (
            <div className="mt-4 space-y-3">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{upload.file.name}</p>
                      <p className="mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">{formatBytes(upload.file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {upload.status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                      {upload.status === "error" ? <XCircle className="h-4 w-4 text-[rgb(var(--error))]" /> : null}
                      {upload.status === "uploading" ? (
                        <span className="size-4 animate-spin rounded-full border-2 border-[rgb(var(--primary))] border-r-transparent" />
                      ) : null}
                      <button
                        type="button"
                        className="rounded-lg p-1 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))] disabled:opacity-60"
                        onClick={() => removeUpload(upload.id)}
                        disabled={upload.status === "uploading"}
                        aria-label="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-hover))]">
                    {upload.status === "uploading" && upload.progress === null ? (
                      <div className="h-full w-full bg-[rgb(var(--primary-soft))] animate-shimmer" />
                    ) : (
                      <div
                        className="h-full bg-[rgb(var(--primary))] transition-all"
                        style={{ width: `${upload.progress ?? (upload.status === "success" ? 100 : 0)}%` }}
                      />
                    )}
                  </div>

                  {upload.message ? (
                    <p
                      className={`mt-2 text-xs ${
                        upload.status === "error" ? "text-[rgb(var(--error))]" : "text-[rgb(var(--text-secondary))]"
                      }`}
                    >
                      {upload.message}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {message ? (
            <div className="mt-3">
              <Alert message={message} variant="info" />
            </div>
          ) : null}

          <Button type="submit" loading={uploading} className="mt-4 w-full sm:w-auto">
            <UploadCloud size={16} /> {uploading ? "Uploading..." : "Upload files"}
          </Button>
        </form>
      </Card>

      <Card title="Files" description="Search files, load more, and restore from trash.">
        <div className="mb-4 grid gap-3 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/70 p-4 dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-primary">{activeCount} active</span>
              <span className="badge">{trashCount} in trash</span>
            </div>
            <div className="inline-flex rounded-[var(--radius-full)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1 dark:border-slate-700 dark:bg-slate-900">
              <Button variant={view === "active" ? "primary" : "ghost"} className="btn-sm" onClick={() => setView("active")}>
                Active
              </Button>
              <Button variant={view === "trash" ? "primary" : "ghost"} className="btn-sm" onClick={() => setView("trash")}>
                Trash
              </Button>
            </div>
          </div>
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
        </div>

        <div className="space-y-3">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/60 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
                <UploadCloud size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">
                {view === "trash" ? "Trash is empty" : "No files yet"}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-[var(--muted)] dark:text-slate-400">
                {view === "trash"
                  ? "Files you remove from the workspace will appear here until you restore them."
                  : "Upload your first study file to keep reference material available across notes and planning."}
              </p>
            </div>
          ) : (
            visible.map((file) => (
              <article key={file.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] dark:text-slate-100">{file.originalName}</p>
                    <p className="text-xs text-[var(--muted)] dark:text-slate-400">{formatBytes(file.size)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)] dark:text-slate-400">
                      {file.verificationStatus === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 text-[rgb(var(--color-success))]">
                          <BadgeCheck size={12} />
                          Verified by expert {file.verifiedBy?.name ?? "reviewer"}
                        </span>
                      ) : file.verificationStatus === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 text-[rgb(var(--color-danger))]">
                          <XCircle size={12} />
                          Rejected by reviewer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[rgb(var(--color-warning))]">
                          <Clock3 size={12} />
                          Awaiting teacher verification
                        </span>
                      )}
                    </p>
                    {file.verificationNotes ? <p className="text-xs text-[var(--muted)] dark:text-slate-400">Reviewer note: {file.verificationNotes}</p> : null}
                  </div>
                  {view === "trash" ? (
                    <Button variant="secondary" onClick={() => restoreFile(file.id)}>
                      <RotateCcw size={14} /> Restore
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/files/${file.id}/download`}
                        className="rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2 text-xs font-semibold hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(file.id)}
                        className="rounded-lg p-2 text-[var(--muted)] hover:bg-[rgb(var(--surface-hover))] hover:text-red-500 dark:text-slate-400 dark:hover:bg-slate-900"
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
