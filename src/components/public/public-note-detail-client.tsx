"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Flag, Heart, Info, Paperclip, Star } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast-provider";

type NoteDetail = {
  id: number;
  title: string;
  content: string;
  subject?: string | null;
  semester?: string | null;
  tags?: string | null;
  createdAt: string;
  user: { id: number; name: string };
  noteVerificationStatus?: "VERIFIED" | "UNVERIFIED";
  attachments?: { file: { id: number; originalName: string; verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" } }[];
  _count: { likes: number; comments: number; bookmarks: number; ratings: number };
};

type Comment = {
  id: number;
  body: string;
  createdAt: string;
  user: { name: string };
};

type ApiResponse<T> = { ok: boolean; data?: T; error?: { message: string } };

export function PublicNoteDetailClient({ slug }: { slug: string }) {
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/notes/public/${slug}`);
      const payload = (await response.json()) as ApiResponse<NoteDetail>;
      if (response.ok && payload.ok && payload.data) {
        setNote(payload.data);
        const commentsRes = await fetch(`/api/notes/comments?noteId=${payload.data.id}`);
        const commentsPayload = (await commentsRes.json()) as ApiResponse<Comment[]>;
        if (commentsRes.ok && commentsPayload.ok && commentsPayload.data) {
          setComments(commentsPayload.data);
        }
      } else {
        pushToast(payload.error?.message ?? "Unable to load note", "error");
      }
    }

    void load();
  }, [slug, pushToast]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note) return;
    const response = await fetch("/api/notes/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: note.id, body: comment }),
    });
    const payload = (await response.json()) as ApiResponse<Comment>;
    if (response.ok && payload.ok && payload.data) {
      setComments((prev) => [payload.data!, ...prev]);
      setComment("");
      setNote((prev) =>
        prev ? { ...prev, _count: { ...prev._count, comments: prev._count.comments + 1 } } : prev,
      );
      pushToast("Comment added", "success");
    }
  }

  async function toggleLike() {
    if (!note) return;
    const response = await fetch("/api/notes/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: note.id }),
    });
    const payload = (await response.json()) as ApiResponse<{ liked: boolean }>;
    if (response.ok && payload.ok) {
      setNote((prev) =>
        prev
          ? {
              ...prev,
              _count: { ...prev._count, likes: prev._count.likes + (payload.data?.liked ? 1 : -1) },
            }
          : prev,
      );
      pushToast("Reaction updated", "success");
    }
  }

  async function toggleBookmark() {
    if (!note) return;
    const response = await fetch("/api/notes/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: note.id }),
    });
    const payload = (await response.json()) as ApiResponse<{ bookmarked: boolean }>;
    if (response.ok && payload.ok) {
      setNote((prev) =>
        prev
          ? {
              ...prev,
              _count: { ...prev._count, bookmarks: prev._count.bookmarks + (payload.data?.bookmarked ? 1 : -1) },
            }
          : prev,
      );
      pushToast("Bookmark updated", "success");
    }
  }

  async function rateNote(value: number) {
    if (!note) return;
    const response = await fetch("/api/notes/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: note.id, rating: value }),
    });
    const payload = (await response.json()) as ApiResponse<{ rating: number }>;
    if (response.ok && payload.ok) {
      pushToast(`Rated ${value} stars`, "success");
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note) return;
    const response = await fetch("/api/notes/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: note.id, reason: reportReason, details: reportDetails || undefined }),
    });
    if (response.ok) {
      setReportOpen(false);
      setReportReason("Spam");
      setReportDetails("");
      pushToast("Report submitted", "success");
    }
  }

  if (!note) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">Loading note...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/notes" className="text-sm text-[var(--brand)] hover:underline">
          Back to library
        </Link>
        <div className="grid gap-2 sm:flex sm:items-center">
          <Button variant="secondary" onClick={toggleLike} className="w-full sm:w-auto">
            <Heart size={14} /> Like ({note._count.likes})
          </Button>
          <Button variant="secondary" onClick={toggleBookmark} className="w-full sm:w-auto">
            <Bookmark size={14} /> Bookmark ({note._count.bookmarks})
          </Button>
          <Button variant="secondary" onClick={() => setReportOpen(true)} className="w-full sm:w-auto">
            <Flag size={14} /> Report
          </Button>
        </div>
      </div>

      <Card>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{note.title}</h1>
        <div className="mt-2">
          {note.noteVerificationStatus === "VERIFIED" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/30 dark:text-emerald-200">
              <BadgeCheck size={12} />
              Verified note
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-300/30 dark:bg-amber-900/30 dark:text-amber-200">
              <Info size={12} />
              Unverified note
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          by <Link href={`/u/${note.user.id}`} className="text-[var(--brand)] hover:underline">{note.user.name}</Link>
        </p>
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
                attachment.file.verificationStatus === "VERIFIED" ? (
                  <a
                    key={attachment.file.id}
                    href={`/api/files/public/${attachment.file.id}/download`}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1 text-xs font-semibold text-[var(--brand)] hover:underline dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]"
                  >
                    <Paperclip size={12} />
                    {attachment.file.originalName}
                  </a>
                ) : (
                  <span
                    key={attachment.file.id}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-300/30 dark:bg-amber-900/30 dark:text-amber-200"
                  >
                    <Info size={12} />
                    {attachment.file.originalName} (Pending verification)
                  </span>
                )
              ))}
            </div>
          </div>
        ) : null}
        <div
          className="mt-4 space-y-3 break-words text-sm text-[var(--text)]"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </Card>

      <Card title="Rate this note" description="Share quick feedback for the community.">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button key={value} variant="secondary" onClick={() => void rateNote(value)}>
              <Star size={14} /> {value}
            </Button>
          ))}
        </div>
      </Card>

      <Card title="Comments" description={`${note._count.comments} comments so far.`}>
        <form onSubmit={submitComment} className="space-y-2">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment..." rows={4} />
          <Button type="submit">Post comment</Button>
        </form>
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No comments yet.</p>
          ) : (
            comments.map((item) => (
              <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{item.user.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.body}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        open={reportOpen}
        title="Report note"
        description="Let the moderation team know what’s wrong."
        onClose={() => setReportOpen(false)}
      >
        <form onSubmit={submitReport} className="space-y-2">
          <Select
            label="Reason"
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            options={[
              { label: "Spam", value: "Spam" },
              { label: "Copyright", value: "Copyright" },
              { label: "Harassment", value: "Harassment" },
              { label: "Other", value: "Other" },
            ]}
          />
          <Textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Details (optional)" rows={3} />
          <Button type="submit">Submit report</Button>
        </form>
      </Modal>
    </div>
  );
}
