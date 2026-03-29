"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Copy, Download, FileText, Pencil, Plus, RotateCcw, Search, Trash2, UploadCloud } from "lucide-react";
import { Alert } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { RichTextEditor } from "@/src/components/ui/rich-text-editor";
import { useToast } from "@/src/components/ui/toast-provider";

type Note = {
  id: number;
  title: string;
  content: string;
  subject?: string | null;
  semester?: string | null;
  tags?: string | null;
  isPublic?: boolean | null;
  slug?: string | null;
  createdAt: string;
  deletedAt: string | null;
  attachments?: { file: { id: number; originalName: string } }[];
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    hasMore?: boolean;
    nextCursor?: number | null;
  };
};

type UserFile = {
  id: number;
  originalName: string;
  size: number;
  deletedAt?: string | null;
};

type NotesClientProps = {
  initialNotes: Note[];
};

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function subjectBadgeClasses(subject: string) {
  const palette = [
    "border-blue-500/30 bg-blue-50 text-blue-700 dark:border-blue-300/30 dark:bg-blue-900/25 dark:text-blue-200",
    "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/25 dark:text-emerald-200",
    "border-amber-500/30 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-900/25 dark:text-amber-200",
    "border-rose-500/30 bg-rose-50 text-rose-700 dark:border-rose-300/30 dark:bg-rose-900/25 dark:text-rose-200",
    "border-cyan-500/30 bg-cyan-50 text-cyan-800 dark:border-cyan-300/30 dark:bg-cyan-900/25 dark:text-cyan-200",
    "border-violet-500/30 bg-violet-50 text-violet-700 dark:border-violet-300/30 dark:bg-violet-900/25 dark:text-violet-200",
  ];
  const idx = hashString(subject) % palette.length;
  return palette[idx] ?? palette[0]!;
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

function SkeletonNotes() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-4 w-2/3 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="h-3 w-28 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
                <div className="h-3 w-5/6 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              </div>
              <div className="h-3 w-20 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotesClient({ initialNotes }: NotesClientProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedAttachments, setSelectedAttachments] = useState<number[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [view, setView] = useState<"active" | "trash">("active");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [listError, setListError] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<number | null>(initialNotes.at(-1)?.id ?? null);
  const [hasMore, setHasMore] = useState(initialNotes.length >= 10);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [deletingNote, setDeletingNote] = useState(false);
  const [restoringNoteId, setRestoringNoteId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editAttachments, setEditAttachments] = useState<number[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [recentFiles, setRecentFiles] = useState<UserFile[]>([]);
  const [shareNote, setShareNote] = useState<Note | null>(null);
  const [sharePermission, setSharePermission] = useState<"VIEW" | "EDIT">("VIEW");
  const { pushToast } = useToast();
  const newNoteTitleRef = useRef<HTMLInputElement | null>(null);

  function goToNewNoteForm() {
    document.getElementById("new-note-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => newNoteTitleRef.current?.focus(), 250);
  }

  useEffect(() => {
    async function loadFiles() {
      const response = await fetch("/api/files?limit=6");
      const payload = (await response.json()) as ApiResponse<UserFile[]>;
      if (response.ok && payload.ok && payload.data) {
        setRecentFiles(payload.data.filter((file) => !file.deletedAt));
      }
    }

    void loadFiles();
  }, []);

  useEffect(() => {
    setSearchInput(initialSearch);
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        search
          ? note.title.toLowerCase().includes(search.toLowerCase()) ||
            stripHtml(note.content).toLowerCase().includes(search.toLowerCase())
          : true,
      ),
    [notes, search],
  );

  const subjects = useMemo(() => Array.from(new Set(notes.map((note) => note.subject).filter(Boolean))) as string[], [notes]);
  const semesters = useMemo(() => Array.from(new Set(notes.map((note) => note.semester).filter(Boolean))) as string[], [notes]);
  const tagsList = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags?.split(",").forEach((tag) => {
        const trimmed = tag.trim();
        if (trimmed) tagSet.add(trimmed);
      });
    });
    return Array.from(tagSet);
  }, [notes]);

  async function createNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        subject: subject || undefined,
        semester: semester || undefined,
        tags: tags || undefined,
        isPublic,
        attachmentIds: selectedAttachments,
      }),
    });

    const payload = (await response.json()) as ApiResponse<Note>;

    if (!response.ok || !payload.ok || !payload.data) {
      setError(payload.error?.message ?? "Could not create note.");
      setLoading(false);
      return;
    }

    setNotes((prev) => [payload.data!, ...prev]);
    setTitle("");
    setContent("");
    setSubject("");
    setSemester("");
    setTags("");
    setSelectedAttachments([]);
    setLoading(false);
    pushToast("Note saved", "success");
  }

  async function uploadAttachment() {
    if (!uploadFile) {
      pushToast("Select a file to upload", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as ApiResponse<UserFile>;
    if (response.ok && payload.ok && payload.data) {
      setRecentFiles((prev) => [payload.data!, ...prev]);
      setSelectedAttachments((prev) => [payload.data!.id, ...prev]);
      setUploadFile(null);
      pushToast("File uploaded", "success");
    } else {
      pushToast(payload.error?.message ?? "Upload failed", "error");
    }
    setUploading(false);
  }

  async function deleteNote() {
    if (!pendingDelete) return;
    setDeletingNote(true);

    try {
      const response = await fetch(`/api/notes?id=${pendingDelete}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as ApiResponse<{ id: number }>;

      if (!response.ok || !payload.ok) {
        setError(payload.error?.message ?? "Could not delete note.");
        setPendingDelete(null);
        return;
      }

      setNotes((prev) =>
        prev.map((note) => (note.id === pendingDelete ? { ...note, deletedAt: new Date().toISOString() } : note)),
      );
      setPendingDelete(null);
      pushToast("Note moved to trash", "info");
    } finally {
      setDeletingNote(false);
    }
  }

  async function restoreNote(id: number) {
    setRestoringNoteId(id);
    const response = await fetch("/api/notes/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const payload = (await response.json()) as ApiResponse<{ id: number }>;

    if (!response.ok || !payload.ok) {
      setError(payload.error?.message ?? "Could not restore note.");
      setRestoringNoteId(null);
      return;
    }

    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, deletedAt: null } : note)));
    pushToast("Note restored", "success");
    setRestoringNoteId(null);
  }

  function startEdit(note: Note) {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSubject(note.subject ?? "");
    setEditSemester(note.semester ?? "");
    setEditTags(note.tags ?? "");
    setEditIsPublic(note.isPublic ?? true);
    setEditAttachments(note.attachments?.map((item) => item.file.id) ?? []);
  }

  async function updateNote() {
    if (!editingNote) return;
    setSavingEdit(true);

    const response = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingNote.id,
        title: editTitle,
        content: editContent,
        subject: editSubject || undefined,
        semester: editSemester || undefined,
        tags: editTags || undefined,
        isPublic: editIsPublic,
        attachmentIds: editAttachments,
      }),
    });

    const payload = (await response.json()) as ApiResponse<Note>;

    if (!response.ok || !payload.ok || !payload.data) {
      setError(payload.error?.message ?? "Could not update note.");
      setSavingEdit(false);
      return;
    }

    setNotes((prev) => prev.map((note) => (note.id === editingNote.id ? payload.data! : note)));
    setEditingNote(null);
    setSavingEdit(false);
    pushToast("Note updated", "success");
  }

  async function loadMore() {
    if (!hasMore || !cursor) return;

    setFetching(true);
    setListError(false);
    const response = await fetch(
      `/api/notes?cursor=${cursor}&limit=10&includeDeleted=${view === "trash" ? "true" : "false"}`,
      {
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as ApiResponse<Note[]>;

    if (!response.ok || !payload.ok || !payload.data) {
      setError(payload.error?.message ?? "Could not load more notes.");
      setListError(true);
      setFetching(false);
      return;
    }

    const incoming = view === "trash" ? payload.data.filter((n) => n.deletedAt) : payload.data.filter((n) => !n.deletedAt);
    setNotes((prev) => [...prev, ...incoming.filter((note) => !prev.some((existing) => existing.id === note.id))]);
    setHasMore(Boolean(payload.meta?.hasMore));
    setCursor(payload.meta?.nextCursor ?? null);
    setFetching(false);
  }

  const list = filteredNotes
    .filter((note) => (view === "trash" ? Boolean(note.deletedAt) : !note.deletedAt))
    .filter((note) => (filterSubject ? note.subject === filterSubject : true))
    .filter((note) => (filterSemester ? note.semester === filterSemester : true))
    .filter((note) => (filterTag ? (note.tags ?? "").includes(filterTag) : true));
  const activeCount = notes.filter((note) => !note.deletedAt).length;
  const trashCount = notes.filter((note) => Boolean(note.deletedAt)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Your workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">My Notes</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Capture, search, and manage private or public notes.</p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={goToNewNoteForm}>
          <Plus size={16} /> New Note
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
      <Card title="New Note" description="Capture ideas quickly with rich, searchable notes." className="lg:sticky lg:top-24">
        <form id="new-note-form" onSubmit={createNote} className="space-y-3">
          <Input ref={newNoteTitleRef} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Note title" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject (optional)" />
            <Input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="Semester (optional)" />
          </div>
          <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated)" />
          <Select
            label="Visibility"
            value={isPublic ? "public" : "private"}
            onChange={(event) => setIsPublic(event.target.value === "public")}
            options={[
              { label: "Public", value: "public" },
              { label: "Private", value: "private" },
            ]}
          />
          <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/75 bg-[rgb(var(--surface-hover)/0.8)] p-3 shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.35)]">
            <p className="text-xs font-semibold text-[var(--muted)]">Upload files for this note</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="file"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.25)]"
              />
              <Button type="button" variant="secondary" loading={uploading} onClick={() => void uploadAttachment()}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
          <Select
            label="Attach files"
            value={selectedAttachments.map(String)[0] ?? ""}
            onChange={(event) => {
              const id = Number(event.target.value);
              if (!Number.isNaN(id)) {
                setSelectedAttachments((prev) => (prev.includes(id) ? prev : [...prev, id]));
              }
            }}
            options={[
              { label: "Select file", value: "" },
              ...recentFiles.map((file) => ({ label: file.originalName, value: String(file.id) })),
            ]}
          />
          {selectedAttachments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedAttachments.map((id) => {
                const file = recentFiles.find((f) => f.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedAttachments((prev) => prev.filter((item) => item !== id))}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1 text-xs text-[var(--muted)]"
                  >
                    {file?.originalName ?? `File ${id}`} x
                  </button>
                );
              })}
            </div>
          ) : null}
          <RichTextEditor value={content} onChange={setContent} placeholder="Write your note here..." />
          {error ? <Alert variant="error" message={error} /> : null}
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            {loading ? "Saving..." : "Save note"}
          </Button>
        </form>
      </Card>

      <Card title="Your Notes" description="Search, filter, and restore notes from trash.">
        <div className="mb-4 grid gap-3 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-primary">{activeCount} active</span>
              <span className="badge">{trashCount} in trash</span>
            </div>
            <div className="inline-flex rounded-[var(--radius-full)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1">
              <Button variant={view === "active" ? "primary" : "ghost"} className="btn-sm" onClick={() => setView("active")}>
                Active
              </Button>
              <Button variant={view === "trash" ? "primary" : "ghost"} className="btn-sm" onClick={() => setView("trash")}>
                Trash
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative w-full">
              <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" />
              <Input
                aria-label="Search notes"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title or content"
                className="pl-9"
              />
              {search.trim() ? (
                <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">{list.length} notes found</p>
              ) : null}
            </div>
            <Select
              label="Subject"
              value={filterSubject}
              onChange={(event) => setFilterSubject(event.target.value)}
              options={[{ label: "All", value: "" }, ...subjects.map((item) => ({ label: item, value: item }))]}
            />
            <Select
              label="Semester"
              value={filterSemester}
              onChange={(event) => setFilterSemester(event.target.value)}
              options={[{ label: "All", value: "" }, ...semesters.map((item) => ({ label: item, value: item }))]}
            />
          </div>

          {tagsList.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFilterTag("")}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  filterTag === ""
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))]"
                }`}
              >
                All
              </button>
              {tagsList.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilterTag(tag)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    filterTag === tag
                      ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : null}

          {listError ? <ErrorCard onRetry={() => void loadMore()} /> : null}
        </div>

        {list.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
              <FileText size={26} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">
              {view === "trash" ? "Trash is empty" : "No notes yet"}
            </h3>
            <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
              {view === "trash"
                ? "Deleted notes show up here so you can restore them later."
                : "Start capturing lectures, summaries, and study ideas in one searchable place."}
            </p>
            <div className="mt-4">
              {view === "trash" ? (
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setView("active")}>
                  Back to notes
                </Button>
              ) : (
                <Button type="button" className="w-full sm:w-auto" onClick={goToNewNoteForm}>
                  Create your first note
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((note) => {
              const subjectLabel = note.subject?.trim() || "General";
              const preview = stripHtml(note.content);
              return (
                <article
                  key={note.id}
                  className="group relative rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
                >
                  {view !== "trash" ? (
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        className="rounded-lg p-2 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))]"
                        aria-label="Edit note"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(note.id)}
                        className="rounded-lg p-2 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--error))]"
                        aria-label="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : null}

                  <div className="min-w-0 pr-12">
                    <h3 className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{note.title}</h3>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${subjectBadgeClasses(subjectLabel)}`}
                    >
                      {subjectLabel}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        note.isPublic
                          ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))]"
                      }`}
                    >
                      {note.isPublic ? "Public" : "Private"}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">{preview || "No content yet."}</p>

                  {note.tags ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {note.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] text-[rgb(var(--text-secondary))]"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  ) : null}

                  {note.attachments?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {note.attachments.slice(0, 3).map((attachment) => (
                        <a
                          key={attachment.file.id}
                          href={`/api/files/${attachment.file.id}/download`}
                          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]"
                        >
                          {attachment.file.originalName}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[rgb(var(--text-tertiary))]">
                    <span>{formatRelativeDate(note.createdAt)}</span>
                    {view === "trash" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 px-3 py-1.5 text-xs"
                        loading={restoringNoteId === note.id}
                        onClick={() => restoreNote(note.id)}
                      >
                        <RotateCcw size={14} /> {restoringNoteId === note.id ? "Restoring..." : "Restore"}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-8 px-3 py-1.5 text-xs"
                          onClick={() => setShareNote(note)}
                        >
                          <Copy size={14} /> Share
                        </Button>
                        {note.isPublic ? (
                          <a
                            href={`/api/notes/${note.id}/download`}
                            className="inline-flex min-h-8 items-center gap-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--background))]"
                          >
                            <Download size={14} /> Download
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {fetching ? (
          <div className="mt-4">
            <SkeletonNotes />
          </div>
        ) : null}

        {hasMore ? (
          <div className="mt-4">
            <Button variant="secondary" onClick={loadMore} loading={fetching} className="w-full sm:w-auto">
              {fetching ? "Loading..." : "Load more"}
            </Button>
          </div>
        ) : null}
      </Card>

      <Card title="Recent Uploads" description="Attach files from your Upload Center to keep notes complete.">
        {recentFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/60 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
              <UploadCloud size={24} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No uploads yet</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Add PDFs, slides, docs, or images so they are ready to attach to your notes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/75 bg-[rgb(var(--surface-hover)/0.8)] p-3 shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.35)]"
              >
                <p className="text-sm font-medium">{file.originalName}</p>
                <a
                  href={`/api/files/${file.id}/download`}
                  className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] hover:-translate-y-0.5 hover:shadow-sm"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Button variant="secondary" onClick={() => (window.location.href = "/dashboard/upload-center")}>
            Open Upload Center
          </Button>
        </div>
      </Card>

      </div>

      <Modal
        open={pendingDelete !== null}
        title="Delete note"
        description="This note will move to trash and can be restored later."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteNote}
        confirmLabel={deletingNote ? "Deleting..." : "Move to trash"}
        danger
      />

      <Modal
        open={editingNote !== null}
        title="Edit note"
        description="Update your note content and save the changes."
        onClose={() => setEditingNote(null)}
        onConfirm={updateNote}
        confirmLabel={savingEdit ? "Saving..." : "Save changes"}
      >
        <div className="space-y-2">
          <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Note title" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={editSubject} onChange={(event) => setEditSubject(event.target.value)} placeholder="Subject" />
            <Input value={editSemester} onChange={(event) => setEditSemester(event.target.value)} placeholder="Semester" />
          </div>
          <Input value={editTags} onChange={(event) => setEditTags(event.target.value)} placeholder="Tags (comma separated)" />
          <Select
            label="Visibility"
            value={editIsPublic ? "public" : "private"}
            onChange={(event) => setEditIsPublic(event.target.value === "public")}
            options={[
              { label: "Public", value: "public" },
              { label: "Private", value: "private" },
            ]}
          />
          <Select
            label="Attach files"
            value={editAttachments.map(String)[0] ?? ""}
            onChange={(event) => {
              const id = Number(event.target.value);
              if (!Number.isNaN(id)) {
                setEditAttachments((prev) => (prev.includes(id) ? prev : [...prev, id]));
              }
            }}
            options={[
              { label: "Select file", value: "" },
              ...recentFiles.map((file) => ({ label: file.originalName, value: String(file.id) })),
            ]}
          />
          {editAttachments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {editAttachments.map((id) => {
                const file = recentFiles.find((f) => f.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEditAttachments((prev) => prev.filter((item) => item !== id))}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1 text-xs text-[var(--muted)]"
                  >
                    {file?.originalName ?? `File ${id}`} x
                  </button>
                );
              })}
            </div>
          ) : null}
          <RichTextEditor value={editContent} onChange={setEditContent} />
          {savingEdit ? <Alert variant="info" message="Saving changes..." /> : null}
        </div>
      </Modal>

      <Modal
        open={shareNote !== null}
        title="Share note"
        description="Choose the permission for this share link."
        onClose={() => setShareNote(null)}
        onConfirm={async () => {
          if (!shareNote) return;
          if (shareNote.isPublic && shareNote.slug) {
            const link = `${window.location.origin}/notes/${shareNote.slug}`;
            await navigator.clipboard.writeText(link);
            pushToast("Share link copied", "success");
            setShareNote(null);
            return;
          }

          const response = await fetch("/api/notes/shares", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ noteId: shareNote.id, permission: sharePermission }),
          });
          const payload = (await response.json()) as ApiResponse<{ token: string }>;
          if (response.ok && payload.ok && payload.data?.token) {
            const link = `${window.location.origin}/notes/share/${payload.data.token}`;
            await navigator.clipboard.writeText(link);
            pushToast("Share link copied", "success");
          } else {
            pushToast("Unable to create share link", "error");
          }
          setShareNote(null);
        }}
        confirmLabel="Copy link"
      >
        <Select
          label="Permission"
          value={sharePermission}
          onChange={(event) => setSharePermission(event.target.value as "VIEW" | "EDIT")}
          options={[
            { label: "View only", value: "VIEW" },
            { label: "Can edit", value: "EDIT" },
          ]}
        />
      </Modal>
    </div>
  );
}
