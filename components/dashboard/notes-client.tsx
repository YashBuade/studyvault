"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
import { Alert } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast-provider";

type Note = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  deletedAt: string | null;
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

type NotesClientProps = {
  initialNotes: Note[];
};

export function NotesClient({ initialNotes }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "trash">("active");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<number | null>(initialNotes.at(-1)?.id ?? null);
  const [hasMore, setHasMore] = useState(initialNotes.length >= 10);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const { pushToast } = useToast();

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        search
          ? note.title.toLowerCase().includes(search.toLowerCase()) ||
            note.content.toLowerCase().includes(search.toLowerCase())
          : true,
      ),
    [notes, search],
  );

  async function createNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
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
    setLoading(false);
    pushToast("Note saved", "success");
  }

  async function deleteNote() {
    if (!pendingDelete) return;

    const response = await fetch(`/api/notes?id=${pendingDelete}`, {
      method: "DELETE",
    });

    const payload = (await response.json()) as ApiResponse<{ id: number }>;

    if (!response.ok || !payload.ok) {
      setError(payload.error?.message ?? "Could not delete note.");
      setPendingDelete(null);
      return;
    }

    setNotes((prev) => prev.map((note) => (note.id === pendingDelete ? { ...note, deletedAt: new Date().toISOString() } : note)));
    setPendingDelete(null);
    pushToast("Note moved to trash", "info");
  }

  async function restoreNote(id: number) {
    const response = await fetch("/api/notes/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const payload = (await response.json()) as ApiResponse<{ id: number }>;

    if (!response.ok || !payload.ok) {
      setError(payload.error?.message ?? "Could not restore note.");
      return;
    }

    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, deletedAt: null } : note)));
    pushToast("Note restored", "success");
  }

  function startEdit(note: Note) {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  async function updateNote() {
    if (!editingNote) return;
    setSavingEdit(true);

    const response = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingNote.id, title: editTitle, content: editContent }),
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
    const response = await fetch(
      `/api/notes?cursor=${cursor}&limit=10&includeDeleted=${view === "trash" ? "true" : "false"}`,
      {
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as ApiResponse<Note[]>;

    if (!response.ok || !payload.ok || !payload.data) {
      setError(payload.error?.message ?? "Could not load more notes.");
      setFetching(false);
      return;
    }

    const incoming = view === "trash" ? payload.data.filter((n) => n.deletedAt) : payload.data.filter((n) => !n.deletedAt);
    setNotes((prev) => [...prev, ...incoming.filter((note) => !prev.some((existing) => existing.id === note.id))]);
    setHasMore(Boolean(payload.meta?.hasMore));
    setCursor(payload.meta?.nextCursor ?? null);
    setFetching(false);
  }

  const list = filteredNotes.filter((note) => (view === "trash" ? Boolean(note.deletedAt) : !note.deletedAt));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
      <Card title="New Note" description="Capture ideas quickly with rich, searchable notes.">
        <form onSubmit={createNote} className="space-y-3">
          <Input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Note title" />
          <Textarea
            required
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your note here..."
            rows={8}
          />
          {error ? <Alert variant="error" message={error} /> : null}
          <Button type="submit" loading={loading}>
            Save Note
          </Button>
        </form>
      </Card>

      <Card title="Your Notes" description="Search, filter, and restore notes from trash.">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" />
            <Input
              aria-label="Search notes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes"
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
          {list.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No notes in this view.</p>
          ) : (
            list.map((note) => (
              <article key={note.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted)]">{note.content}</p>
                  </div>
                  {view === "trash" ? (
                    <Button variant="secondary" onClick={() => restoreNote(note.id)}>
                      <RotateCcw size={14} /> Restore
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => startEdit(note)}>
                        <Pencil size={14} /> Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(note.id)}
                        className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/50 hover:text-red-500"
                        aria-label="Delete note"
                      >
                        <Trash2 size={16} />
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
            <Button variant="secondary" onClick={loadMore} loading={fetching}>
              Load More
            </Button>
          </div>
        ) : null}
      </Card>

      <Modal
        open={pendingDelete !== null}
        title="Delete note"
        description="This note will move to trash and can be restored later."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteNote}
        confirmLabel="Move to Trash"
        danger
      />

      <Modal
        open={editingNote !== null}
        title="Edit note"
        description="Update your note content and save the changes."
        onClose={() => setEditingNote(null)}
        onConfirm={updateNote}
        confirmLabel="Save Changes"
      >
        <div className="space-y-2">
          <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Note title" />
          <Textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={6} />
          {savingEdit ? <Alert variant="info" message="Saving changes..." /> : null}
        </div>
      </Modal>
    </div>
  );
}
