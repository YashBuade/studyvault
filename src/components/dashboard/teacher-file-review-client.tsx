"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { useToast } from "@/src/components/ui/toast-provider";

type ReviewFile = {
  id: number;
  originalName: string;
  size: number;
  mimeType: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationNotes?: string | null;
  user: { id: number; name: string; email: string };
  verifiedBy?: { id: number; name: string; email: string } | null;
  verifiedAt?: string | null;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string };
};

export function TeacherFileReviewClient() {
  const [files, setFiles] = useState<ReviewFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const { pushToast } = useToast();

  useEffect(() => {
    async function loadQueue() {
      setLoading(true);
      const response = await fetch(`/api/teacher/files/review?status=${statusFilter}`);
      const payload = (await response.json()) as ApiResponse<ReviewFile[]>;
      if (response.ok && payload.ok && payload.data) {
        setFiles(payload.data);
      }
      setLoading(false);
    }
    void loadQueue();
  }, [statusFilter]);

  async function updateFile(fileId: number, status: "VERIFIED" | "REJECTED") {
    setSubmitting((prev) => ({ ...prev, [fileId]: true }));
    const response = await fetch("/api/teacher/files/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, status, notes: notes[fileId] || "" }),
    });
    const payload = (await response.json()) as ApiResponse<{ id: number }>;
    if (!response.ok || !payload.ok) {
      pushToast(payload.error?.message || "Unable to update file verification", "error");
      setSubmitting((prev) => ({ ...prev, [fileId]: false }));
      return;
    }
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
    setSubmitting((prev) => ({ ...prev, [fileId]: false }));
    pushToast(`File ${status === "VERIFIED" ? "verified" : "rejected"}`, "success");
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Expert file verification queue</p>
          <p className="text-xs text-[var(--muted)]">Only expert-verified files become visible in the public library.</p>
        </div>
        <div className="flex items-center gap-2">
          {(["PENDING", "VERIFIED", "REJECTED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                statusFilter === status
                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? <p className="text-sm text-[var(--muted)]">Loading queue...</p> : null}
        {!loading && files.length === 0 ? <p className="text-sm text-[var(--muted)]">No files found for this status.</p> : null}
        {files.map((file) => (
          <article key={file.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{file.originalName}</p>
                <p className="text-xs text-[var(--muted)]">{file.mimeType} | {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-xs text-[var(--muted)]">
                  Uploaded by {file.user.name} ({file.user.email})
                </p>
              </div>
              <a
                href={`/api/teacher/files/${file.id}/download`}
                className="rounded-lg border border-[rgb(var(--border))] bg-[var(--panel)] px-3 py-2 text-xs font-semibold"
              >
                Download
              </a>
            </div>
            <div className="mt-3 space-y-2">
              {statusFilter === "PENDING" ? (
                <>
                  <Input
                    value={notes[file.id] || ""}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [file.id]: event.target.value }))}
                    placeholder="Optional review note"
                  />
                  <div className="flex items-center gap-2">
                    <Button loading={Boolean(submitting[file.id])} onClick={() => updateFile(file.id, "VERIFIED")}>
                      Verify as Expert
                    </Button>
                    <Button
                      variant="danger"
                      loading={Boolean(submitting[file.id])}
                      onClick={() => updateFile(file.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  {file.verificationStatus === "VERIFIED"
                    ? `Verified by expert ${file.verifiedBy?.name ?? "reviewer"}`
                    : "Rejected by expert reviewer"}
                  {file.verificationNotes ? ` | Note: ${file.verificationNotes}` : ""}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
