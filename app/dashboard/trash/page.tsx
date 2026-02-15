"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import { useToast } from "@/src/components/ui/toast-provider";

type Note = { id: number; title: string; deletedAt: string | null };
type File = { id: number; originalName: string; deletedAt: string | null };

type ApiResponse<T> = { ok: boolean; data?: T };

export default function TrashPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [pendingNotePurge, setPendingNotePurge] = useState<number | null>(null);
  const [pendingFilePurge, setPendingFilePurge] = useState<number | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const [notesRes, filesRes] = await Promise.all([
        fetch("/api/notes?includeDeleted=true&limit=20"),
        fetch("/api/files?includeDeleted=true&limit=20"),
      ]);

      const notesPayload = (await notesRes.json()) as ApiResponse<Note[]>;
      const filesPayload = (await filesRes.json()) as ApiResponse<File[]>;

      setNotes((notesPayload.data ?? []).filter((note) => note.deletedAt));
      setFiles((filesPayload.data ?? []).filter((file) => file.deletedAt));
    }

    void load();
  }, []);

  async function restoreNote(id: number) {
    const response = await fetch("/api/notes/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      pushToast("Note restored", "success");
    }
  }

  async function purgeNote() {
    if (!pendingNotePurge) return;

    const response = await fetch("/api/notes/purge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pendingNotePurge }),
    });

    if (response.ok) {
      setNotes((prev) => prev.filter((note) => note.id !== pendingNotePurge));
      pushToast("Note permanently deleted", "info");
    }

    setPendingNotePurge(null);
  }

  async function restoreFile(id: number) {
    const response = await fetch("/api/files/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setFiles((prev) => prev.filter((file) => file.id !== id));
      pushToast("File restored", "success");
    }
  }

  async function purgeFile() {
    if (!pendingFilePurge) return;

    const response = await fetch("/api/files/purge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pendingFilePurge }),
    });

    if (response.ok) {
      setFiles((prev) => prev.filter((file) => file.id !== pendingFilePurge));
      pushToast("File permanently deleted", "info");
    }

    setPendingFilePurge(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Trashed Notes" description="Restore notes that were soft-deleted.">
        <div className="space-y-2">
          {notes.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No trashed notes.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-sm font-medium">{note.title}</p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => restoreNote(note.id)}>
                    <RotateCcw size={14} /> Restore
                  </Button>
                  <Button variant="danger" onClick={() => setPendingNotePurge(note.id)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Trashed Files" description="Restore file records.">
        <div className="space-y-2">
          {files.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No trashed files.</p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-sm font-medium">{file.originalName}</p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => restoreFile(file.id)}>
                    <RotateCcw size={14} /> Restore
                  </Button>
                  <Button variant="danger" onClick={() => setPendingFilePurge(file.id)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        open={pendingNotePurge !== null}
        title="Delete note permanently"
        description="This will remove the note forever. This action cannot be undone."
        onClose={() => setPendingNotePurge(null)}
        onConfirm={purgeNote}
        danger
      />

      <Modal
        open={pendingFilePurge !== null}
        title="Delete file permanently"
        description="This will remove the file forever. This action cannot be undone."
        onClose={() => setPendingFilePurge(null)}
        onConfirm={purgeFile}
        danger
      />
    </div>
  );
}
