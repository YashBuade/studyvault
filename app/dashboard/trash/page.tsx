"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, FileText, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import { useToast } from "@/src/components/ui/toast-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleShell } from "@/components/dashboard/module-shell";

type Note = { id: number; title: string; deletedAt: string | null };
type File = { id: number; originalName: string; deletedAt: string | null };

type ApiResponse<T> = { ok: boolean; data?: T; meta?: { hasMore?: boolean; nextCursor?: number | null } };

async function fetchDeletedPages<T extends { id: number; deletedAt: string | null }>(
  base: string,
  maxDeleted: number,
): Promise<T[]> {
  const deleted: T[] = [];
  let cursor: number | null | undefined = undefined;
  let pages = 0;

  while (pages < 12 && deleted.length < maxDeleted) {
    const params = new URLSearchParams({ includeDeleted: "true", limit: "20" });
    if (cursor) params.set("cursor", String(cursor));

    const response = await fetch(`${base}?${params.toString()}`, { cache: "no-store" });
    const payload = (await response.json()) as ApiResponse<T[]>;

    if (!response.ok || !payload.ok) {
      throw new Error("LOAD_FAILED");
    }

    const data = payload.data ?? [];
    deleted.push(...data.filter((entry) => entry.deletedAt));

    const hasMore = Boolean(payload.meta?.hasMore);
    const nextCursor = payload.meta?.nextCursor ?? null;
    if (!hasMore || !nextCursor) break;

    cursor = nextCursor;
    pages += 1;
  }

  return deleted;
}

function formatRelativeDate(input: string | undefined | null) {
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

function SkeletonItems() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="h-3 w-32 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="h-9 w-28 rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TrashPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<"notes" | "files">("notes");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(() => new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(() => new Set());
  const [pendingNotePurge, setPendingNotePurge] = useState<number | null>(null);
  const [pendingFilePurge, setPendingFilePurge] = useState<number | null>(null);
  const [pendingBulkPurge, setPendingBulkPurge] = useState<"notes" | "files" | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const { pushToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const [deletedNotes, deletedFiles] = await Promise.all([
        fetchDeletedPages<Note>("/api/notes", 60),
        fetchDeletedPages<File>("/api/files", 60),
      ]);

      setNotes(deletedNotes);
      setFiles(deletedFiles);
      setSelectedNotes(new Set());
      setSelectedFiles(new Set());
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restoreNote(id: number) {
    setRestoringId(`note:${id}`);
    const response = await fetch("/api/notes/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setSelectedNotes((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      pushToast("Note restored", "success");
    }
    setRestoringId(null);
  }

  async function purgeNote() {
    if (!pendingNotePurge) return;
    setPurging(true);

    const response = await fetch("/api/notes/purge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pendingNotePurge }),
    });

    if (response.ok) {
      setNotes((prev) => prev.filter((note) => note.id !== pendingNotePurge));
      setSelectedNotes((prev) => {
        const next = new Set(prev);
        next.delete(pendingNotePurge);
        return next;
      });
      pushToast("Note permanently deleted", "success");
    }

    setPendingNotePurge(null);
    setPurging(false);
  }

  async function restoreFile(id: number) {
    setRestoringId(`file:${id}`);
    const response = await fetch("/api/files/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setFiles((prev) => prev.filter((file) => file.id !== id));
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      pushToast("File restored", "success");
    }
    setRestoringId(null);
  }

  async function purgeFile() {
    if (!pendingFilePurge) return;
    setPurging(true);

    const response = await fetch("/api/files/purge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pendingFilePurge }),
    });

    if (response.ok) {
      setFiles((prev) => prev.filter((file) => file.id !== pendingFilePurge));
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(pendingFilePurge);
        return next;
      });
      pushToast("File permanently deleted", "success");
    }

    setPendingFilePurge(null);
    setPurging(false);
  }

  async function restoreSelected() {
    if (activeTab === "notes") {
      const ids = Array.from(selectedNotes);
      for (const id of ids) {
        await restoreNote(id);
      }
      return;
    }

    const ids = Array.from(selectedFiles);
    for (const id of ids) {
      await restoreFile(id);
    }
  }

  async function purgeSelected(kind: "notes" | "files") {
    setPurging(true);
    try {
      if (kind === "notes") {
        const ids = Array.from(selectedNotes);
        for (const id of ids) {
          await fetch("/api/notes/purge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
        }
        setNotes((prev) => prev.filter((n) => !selectedNotes.has(n.id)));
        setSelectedNotes(new Set());
        pushToast("Notes permanently deleted", "success");
      } else {
        const ids = Array.from(selectedFiles);
        for (const id of ids) {
          await fetch("/api/files/purge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
        }
        setFiles((prev) => prev.filter((f) => !selectedFiles.has(f.id)));
        setSelectedFiles(new Set());
        pushToast("Files permanently deleted", "success");
      }
    } finally {
      setPurging(false);
      setPendingBulkPurge(null);
    }
  }

  const selectedCount = activeTab === "notes" ? selectedNotes.size : selectedFiles.size;
  const currentNotes = notes.slice().sort((a, b) => new Date(b.deletedAt ?? 0).getTime() - new Date(a.deletedAt ?? 0).getTime());
  const currentFiles = files.slice().sort((a, b) => new Date(b.deletedAt ?? 0).getTime() - new Date(a.deletedAt ?? 0).getTime());

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trash"
        description="Recover recently deleted notes and files, or permanently remove them."
        insight="Restore items quickly if removed by mistake. Permanent delete cannot be undone."
      />
      <ModuleShell
        summary="Use trash as a safety layer: restore accidental deletions first, and purge only when sure."
        checklist={["Review deleted notes", "Restore needed files", "Purge only final removals"]}
        highlights={[
          { label: "Trashed Notes", value: String(notes.length) },
          { label: "Trashed Files", value: String(files.length) },
        ]}
      >
        <div className="rounded-[var(--radius-lg)] border border-amber-500/30 bg-amber-50 p-4 text-amber-800 shadow-[var(--shadow-sm)] dark:border-amber-300/30 dark:bg-amber-900/20 dark:text-amber-100">
          <p className="text-sm font-semibold">Auto-delete warning</p>
          <p className="mt-1 text-sm">Items in trash are permanently deleted after 30 days.</p>
        </div>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  activeTab === "notes"
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))]"
                }`}
              >
                Deleted Notes
                <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-0.5 text-xs text-[rgb(var(--text-secondary))]">
                  {notes.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("files")}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  activeTab === "files"
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))]"
                }`}
              >
                Deleted Files
                <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-0.5 text-xs text-[rgb(var(--text-secondary))]">
                  {files.length}
                </span>
              </button>
            </div>

            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => void load()}>
              Refresh
            </Button>
          </div>
        </Card>

        {hasError ? (
          <ErrorCard onRetry={() => void load()} />
        ) : loading ? (
          <SkeletonItems />
        ) : activeTab === "notes" ? (
          currentNotes.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 text-center shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                <Trash2 size={26} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">Deleted notes are empty</h3>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">When you delete a note, it shows up here for 30 days.</p>
              <div className="mt-4">
                <Button type="button" className="w-full sm:w-auto" onClick={() => (window.location.href = "/dashboard/notes")}>
                  Go to notes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))]">
                  <input
                    type="checkbox"
                    checked={selectedNotes.size > 0 && selectedNotes.size === currentNotes.length}
                    onChange={(event) => {
                      if (event.target.checked) setSelectedNotes(new Set(currentNotes.map((n) => n.id)));
                      else setSelectedNotes(new Set());
                    }}
                    className="h-4 w-4 rounded border border-[rgb(var(--border))]"
                  />
                  Select all
                </label>
              </div>

              {currentNotes.map((note) => {
                const checked = selectedNotes.has(note.id);
                return (
                  <div
                    key={note.id}
                    className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 transition-all hover:shadow-[var(--shadow-md)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setSelectedNotes((prev) => {
                              const next = new Set(prev);
                              if (event.target.checked) next.add(note.id);
                              else next.delete(note.id);
                              return next;
                            });
                          }}
                          className="mt-1 h-4 w-4 rounded border border-[rgb(var(--border))]"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{note.title}</p>
                          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Deleted {formatRelativeDate(note.deletedAt)}</p>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          loading={restoringId === `note:${note.id}`}
                          className="w-full sm:w-auto"
                          onClick={() => void restoreNote(note.id)}
                        >
                          <RotateCcw size={14} /> {restoringId === `note:${note.id}` ? "Restoring..." : "Restore"}
                        </Button>
                        <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={() => setPendingNotePurge(note.id)}>
                          <Trash2 size={14} /> Delete permanently
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : currentFiles.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 text-center shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
              <FileText size={26} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">Deleted files are empty</h3>
            <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">When you delete a file, it shows up here for 30 days.</p>
            <div className="mt-4">
              <Button type="button" className="w-full sm:w-auto" onClick={() => (window.location.href = "/dashboard/my-files")}>
                Go to files
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))]">
              <input
                type="checkbox"
                checked={selectedFiles.size > 0 && selectedFiles.size === currentFiles.length}
                onChange={(event) => {
                  if (event.target.checked) setSelectedFiles(new Set(currentFiles.map((f) => f.id)));
                  else setSelectedFiles(new Set());
                }}
                className="h-4 w-4 rounded border border-[rgb(var(--border))]"
              />
              Select all
            </label>

            {currentFiles.map((file) => {
              const checked = selectedFiles.has(file.id);
              return (
                <div
                  key={file.id}
                  className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 transition-all hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedFiles((prev) => {
                            const next = new Set(prev);
                            if (event.target.checked) next.add(file.id);
                            else next.delete(file.id);
                            return next;
                          });
                        }}
                        className="mt-1 h-4 w-4 rounded border border-[rgb(var(--border))]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{file.originalName}</p>
                        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Deleted {formatRelativeDate(file.deletedAt)}</p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        loading={restoringId === `file:${file.id}`}
                        className="w-full sm:w-auto"
                        onClick={() => void restoreFile(file.id)}
                      >
                        <RotateCcw size={14} /> {restoringId === `file:${file.id}` ? "Restoring..." : "Restore"}
                      </Button>
                      <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={() => setPendingFilePurge(file.id)}>
                        <Trash2 size={14} /> Delete permanently
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedCount > 0 ? (
          <div className="sticky bottom-20 z-30 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur md:bottom-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{selectedCount} items selected</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => void restoreSelected()}>
                  Restore all
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="w-full sm:w-auto"
                  onClick={() => setPendingBulkPurge(activeTab)}
                >
                  Delete all permanently
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <Modal
          open={pendingNotePurge !== null}
          title="Delete note permanently"
          description="This will remove the note forever. This action cannot be undone."
          onClose={() => setPendingNotePurge(null)}
          onConfirm={purgeNote}
          confirmLabel={purging ? "Deleting..." : "Delete permanently"}
          danger
        />

        <Modal
          open={pendingFilePurge !== null}
          title="Delete file permanently"
          description="This will remove the file forever. This action cannot be undone."
          onClose={() => setPendingFilePurge(null)}
          onConfirm={purgeFile}
          confirmLabel={purging ? "Deleting..." : "Delete permanently"}
          danger
        />

        <Modal
          open={pendingBulkPurge !== null}
          title="Delete selected items permanently"
          description="This will remove the selected items forever. This action cannot be undone."
          onClose={() => setPendingBulkPurge(null)}
          onConfirm={() => void purgeSelected(pendingBulkPurge ?? "notes")}
          confirmLabel={purging ? "Deleting..." : "Delete permanently"}
          danger
        />
      </ModuleShell>
    </div>
  );
}
