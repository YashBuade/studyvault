"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Copy, Download, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
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

export function NotesClient({ initialNotes }: NotesClientProps) {
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
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterTag, setFilterTag] = useState("");
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

  const list = filteredNotes
    .filter((note) => (view === "trash" ? Boolean(note.deletedAt) : !note.deletedAt))
    .filter((note) => (filterSubject ? note.subject === filterSubject : true))
    .filter((note) => (filterSemester ? note.semester === filterSemester : true))
    .filter((note) => (filterTag ? (note.tags ?? "").includes(filterTag) : true));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
      <Card title="New Note" description="Capture ideas quickly with rich, searchable notes.">
        <form onSubmit={createNote} className="space-y-3">
          <Input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Note title" />
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
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
            <p className="text-xs font-semibold text-[var(--muted)]">Upload files for this note</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="file"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              />
              <Button type="button" variant="secondary" loading={uploading} onClick={() => void uploadAttachment()}>
                Upload
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
                    {file?.originalName ?? `File ${id}`} ×
                  </button>
                );
              })}
            </div>
          ) : null}
          <RichTextEditor value={content} onChange={setContent} placeholder="Write your note here..." />
          {error ? <Alert variant="error" message={error} /> : null}
          <Button type="submit" loading={loading}>
            Save Note
          </Button>
        </form>
      </Card>

      <Card title="Your Notes" description="Search, filter, and restore notes from trash.">
        <div className="mb-3 flex flex-col gap-2">
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
          <div className="flex flex-wrap items-center gap-2">
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
            <Select
              label="Tag"
              value={filterTag}
              onChange={(event) => setFilterTag(event.target.value)}
              options={[{ label: "All", value: "" }, ...tagsList.map((item) => ({ label: item, value: item }))]}
            />
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
              <article key={note.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{note.title}</h3>
                    <div
                      className="mt-2 line-clamp-3 text-sm text-[var(--muted)]"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      {note.subject ? <span>Subject: {note.subject}</span> : null}
                      {note.semester ? <span>Semester: {note.semester}</span> : null}
                      {note.tags ? <span>Tags: {note.tags}</span> : null}
                      {note.isPublic ? <span className="text-[var(--brand)]">Public</span> : <span>Private</span>}
                    </div>
                    {note.attachments?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {note.attachments.map((attachment) => (
                          <a
                            key={attachment.file.id}
                            href={`/api/files/${attachment.file.id}/download`}
                            className="rounded-full border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--brand)] hover:underline"
                          >
                            {attachment.file.originalName}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {view === "trash" ? (
                    <Button variant="secondary" onClick={() => restoreNote(note.id)}>
                      <RotateCcw size={14} /> Restore
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <>
                        <Button variant="secondary" onClick={() => setShareNote(note)}>
                          <Copy size={14} /> Share
                        </Button>
                        {note.isPublic ? (
                          <a
                            href={`/api/notes/${note.id}/download`}
                            className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2 text-sm font-semibold hover:-translate-y-0.5 hover:shadow-sm"
                          >
                            <Download size={14} /> Download
                          </a>
                        ) : null}
                      </>
                      <Button variant="secondary" onClick={() => startEdit(note)}>
                        <Pencil size={14} /> Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(note.id)}
                        className="rounded-lg p-2 text-[var(--muted)] hover:bg-[rgb(var(--surface-hover))] hover:text-red-500"
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

      <Card title="Recent Uploads" description="Attach files from your Upload Center to keep notes complete.">
        {recentFiles.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No uploads yet. Add PDFs, DOCs, PPTs, or images.</p>
        ) : (
          <div className="space-y-2">
            {recentFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
                <p className="text-sm font-medium">{file.originalName}</p>
                <a
                  href={`/api/files/${file.id}/download`}
                  className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2 text-xs font-semibold hover:-translate-y-0.5 hover:shadow-sm"
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
                    {file?.originalName ?? `File ${id}`} ×
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
