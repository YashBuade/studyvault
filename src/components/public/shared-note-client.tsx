"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast-provider";
import { Paperclip } from "lucide-react";

type SharedNote = {
  id: number;
  title: string;
  content: string;
  subject?: string | null;
  semester?: string | null;
  tags?: string | null;
  createdAt: string;
  user: { name: string };
  permission?: "VIEW" | "EDIT";
  attachments?: { file: { id: number; originalName: string } }[];
};

type ApiResponse<T> = { ok: boolean; data?: T; error?: { message: string } };

export function SharedNoteClient({ token }: { token: string }) {
  const [note, setNote] = useState<SharedNote | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [tags, setTags] = useState("");
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/notes/shares/${token}`);
      const payload = (await response.json()) as ApiResponse<SharedNote>;
      if (response.ok && payload.ok && payload.data) {
        setNote(payload.data);
        setTitle(payload.data.title);
        setContent(payload.data.content);
        setSubject(payload.data.subject ?? "");
        setSemester(payload.data.semester ?? "");
        setTags(payload.data.tags ?? "");
      } else {
        pushToast(payload.error?.message ?? "Unable to load shared note", "error");
      }
    }

    void load();
  }, [token, pushToast]);

  if (!note) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">Loading shared note...</p>
      </Card>
    );
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/notes/shares/${token}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, subject, semester, tags }),
    });
    const payload = (await response.json()) as ApiResponse<SharedNote>;
    if (response.ok && payload.ok) {
      setNote((prev) => (prev ? { ...prev, title, content, subject, semester, tags } : prev));
      setEditing(false);
      pushToast("Shared note updated", "success");
    } else {
      pushToast(payload.error?.message ?? "Unable to update note", "error");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{note.title}</h1>
            <p className="mt-1 text-xs text-[var(--muted)]">by {note.user.name}</p>
          </div>
          {note.permission === "EDIT" ? (
            <Button variant="secondary" onClick={() => setEditing((prev) => !prev)}>
              {editing ? "Cancel" : "Edit note"}
            </Button>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={saveEdit} className="mt-4 space-y-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
              <Input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="Semester" />
            </div>
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags" />
            <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={8} />
            <Button type="submit">Save changes</Button>
          </form>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              {note.subject ? <span>Subject: {note.subject}</span> : null}
              {note.semester ? <span>Semester: {note.semester}</span> : null}
              {note.tags ? <span>Tags: {note.tags}</span> : null}
            </div>
            {note.attachments?.length ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[var(--muted)]">Attachments</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {note.attachments.map((attachment) => (
                    <a
                    key={attachment.file.id}
                    href={`/api/files/public/${attachment.file.id}/download`}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1 text-xs font-semibold text-[var(--brand)] hover:underline"
                  >
                      <Paperclip size={12} />
                      {attachment.file.originalName}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            <div
              className="mt-4 space-y-3 break-words text-sm text-[var(--text)]"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </>
        )}
      </Card>

      <Card>
        <p className="text-xs text-[var(--muted)]">This note was shared via a private link.</p>
        <Button variant="secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}>
          Copy link
        </Button>
      </Card>
    </div>
  );
}
