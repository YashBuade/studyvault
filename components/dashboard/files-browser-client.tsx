"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  Clock3,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Pencil,
  Presentation,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
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
  createdAt?: string;
  deletedAt: string | null;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  meta?: { hasMore?: boolean; nextCursor?: number | null };
  error?: { message?: string };
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  const normalized = (mimeType ?? "").toLowerCase();
  if (normalized.includes("pdf")) return { Icon: FileText, tone: "text-red-600 dark:text-red-300" };
  if (normalized.includes("word") || normalized.includes("msword") || normalized.includes("officedocument.wordprocessingml")) {
    return { Icon: FileText, tone: "text-blue-600 dark:text-blue-300" };
  }
  if (normalized.includes("excel") || normalized.includes("spreadsheet") || normalized.includes("csv")) {
    return { Icon: FileSpreadsheet, tone: "text-emerald-600 dark:text-emerald-300" };
  }
  if (normalized.includes("powerpoint") || normalized.includes("presentation")) {
    return { Icon: Presentation, tone: "text-orange-600 dark:text-orange-300" };
  }
  if (normalized.includes("image")) return { Icon: ImageIcon, tone: "text-purple-600 dark:text-purple-300" };
  return { Icon: FileIcon, tone: "text-[rgb(var(--text-tertiary))]" };
}

function formatRelativeDate(input: string | undefined) {
  if (!input) return "";
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
              <div className="h-11 w-11 rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-56 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
                <div className="h-3 w-32 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              </div>
            </div>
            <div className="h-3 w-16 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
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

export function FilesBrowserClient({ initialFiles }: { initialFiles: UserFile[] }) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const [files, setFiles] = useState<UserFile[]>(initialFiles);
  const [search, setSearch] = useState(initialSearch);
  const [showDeleted, setShowDeleted] = useState(false);
  const [cursor, setCursor] = useState<number | null>(initialFiles.at(-1)?.id ?? null);
  const [hasMore, setHasMore] = useState(initialFiles.length >= 10);
  const [reloading, setReloading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [editing, setEditing] = useState<UserFile | null>(null);
  const [editName, setEditName] = useState("");
  const [restoring, setRestoring] = useState<number | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return files.filter((file) => {
      if (!showDeleted && file.deletedAt) return false;
      if (!normalized) return true;
      return file.originalName.toLowerCase().includes(normalized);
    });
  }, [files, search, showDeleted]);

  async function reload({ includeDeleted }: { includeDeleted: boolean }) {
    setReloading(true);
    setHasError(false);
    try {
      const response = await fetch(`/api/files?limit=10&includeDeleted=${includeDeleted ? "true" : "false"}`, { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<UserFile[]>;
      if (response.ok && payload.ok && payload.data) {
        setFiles(payload.data);
        setHasMore(Boolean(payload.meta?.hasMore));
        setCursor(payload.meta?.nextCursor ?? null);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setReloading(false);
    }
  }

  async function loadMore() {
    if (!cursor || !hasMore) return;

    setLoadingMore(true);
    setHasError(false);
    const response = await fetch(`/api/files?cursor=${cursor}&limit=10&includeDeleted=${showDeleted ? "true" : "false"}`);
    const payload = (await response.json()) as ApiResponse<UserFile[]>;

    if (response.ok && payload.ok && payload.data) {
      setFiles((prev) => [...prev, ...payload.data!.filter((file) => !prev.some((entry) => entry.id === file.id))]);
      setHasMore(Boolean(payload.meta?.hasMore));
      setCursor(payload.meta?.nextCursor ?? null);
    } else {
      setHasError(true);
    }

    setLoadingMore(false);
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
    } else {
      pushToast(payload.error?.message ?? "Unable to rename file", "error");
    }
  }

  async function restoreFile(id: number) {
    setRestoring(id);
    try {
      const response = await fetch("/api/files/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        pushToast("Unable to restore file", "error");
        return;
      }
      setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, deletedAt: null } : file)));
      pushToast("File restored", "success");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Your workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">My Files</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Search, filter, and download your study files.</p>
        </div>
        <Link href="/dashboard/upload-center" className="inline-flex w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Upload files</Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-lg">
            <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[rgb(var(--text-tertiary))]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files" className="pl-9" />
          </div>
          <label className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(event) => {
                const next = event.target.checked;
                setShowDeleted(next);
                void reload({ includeDeleted: next });
              }}
              className="h-4 w-4 rounded border border-[rgb(var(--border))]"
            />
            Show deleted files
          </label>
        </div>
      </Card>

      {hasError ? (
        <ErrorCard onRetry={() => void reload({ includeDeleted: showDeleted })} />
      ) : reloading ? (
        <SkeletonList />
      ) : visible.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 text-center shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
            <FileIcon size={26} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">{showDeleted ? "Trash is empty" : "No files yet"}</h3>
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            {showDeleted ? "Deleted files will appear here until you restore them." : "Upload your first study file to keep reference material close."}
          </p>
          <div className="mt-4">
            <Link href="/dashboard/upload-center" className="inline-flex w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Upload a file</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((file) => {
            const { Icon, tone } = getFileIcon(file.mimeType);
            const isDeleted = Boolean(file.deletedAt);

            const verificationBadge =
              file.verificationStatus === "VERIFIED" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                  <BadgeCheck size={12} /> ✓ Verified
                </span>
              ) : file.verificationStatus === "REJECTED" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-200">
                  <XCircle size={12} /> Not approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  <Clock3 size={12} /> Awaiting review
                </span>
              );

            return (
              <div
                key={file.id}
                className={`group rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] ${
                  isDeleted ? "border-red-500/30 bg-red-50/30 dark:bg-red-950/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] ${tone}`}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{file.originalName}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
                        {formatBytes(file.size)} • Added {formatRelativeDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))]"
                      aria-label="Rename file"
                      onClick={() => startEdit(file)}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {verificationBadge}
                  {file.verificationStatus === "VERIFIED" && file.verifiedBy ? (
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">by {file.verifiedBy.name}</span>
                  ) : null}
                </div>

                {file.verificationNotes ? (
                  <p className="mt-3 line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">Reviewer note: {file.verificationNotes}</p>
                ) : null}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={`/api/files/${file.id}/download`}
                    className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 text-sm font-semibold text-[rgb(var(--text-primary))] transition-all hover:bg-[rgb(var(--surface-hover))] sm:w-auto"
                  >
                    Download
                  </a>
                  {isDeleted ? (
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto"
                      loading={restoring === file.id}
                      onClick={() => void restoreFile(file.id)}
                    >
                      {restoring === file.id ? "Restoring..." : "Restore"}
                    </Button>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 text-sm font-semibold text-[rgb(var(--text-primary))] transition-all hover:bg-[rgb(var(--surface-hover))] sm:w-auto"
                      onClick={() => window.location.assign("/dashboard/upload-center")}
                    >
                      <Trash2 size={14} className="mr-2" />
                      Manage
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && !hasError ? (
        <div className="flex justify-center">
          <Button variant="secondary" loading={loadingMore} onClick={loadMore} className="w-full sm:w-auto">
            {loadingMore ? "Loading..." : "Load more"}
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
    </div>
  );
}
