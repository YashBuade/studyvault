"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { useToast } from "@/src/components/ui/toast-provider";

type TeacherRequest = {
  id: number;
  name: string;
  email: string;
  collegeId?: string | null;
  department?: string | null;
  teacherVerificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  teacherReviewNotes?: string | null;
  teacherVerifiedAt?: string | null;
  teacherCollegeIdImagePath?: string | null;
  teacherCollegeIdImageMimeType?: string | null;
  createdAt: string;
  teacherReviewedBy?: { id: number; name: string; email: string } | null;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string };
};

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

export function AdminTeachersClient() {
  const [items, setItems] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/teachers");
      const payload = (await response.json()) as ApiResponse<TeacherRequest[]>;
      if (response.ok && payload.ok && payload.data) {
        setItems(payload.data);
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function review(teacherId: number, status: "APPROVED" | "REJECTED") {
    if (status === "REJECTED" && !notes[teacherId]?.trim()) {
      pushToast("Add a rejection reason before rejecting this teacher.", "error");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [teacherId]: true }));
    const response = await fetch("/api/admin/teachers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, status, reviewNotes: notes[teacherId] || "" }),
    });
    const payload = (await response.json()) as ApiResponse<{ teacherVerificationStatus: "APPROVED" | "REJECTED" }>;
    if (!response.ok || !payload.ok) {
      pushToast(payload.error?.message || "Unable to update teacher status", "error");
      setSubmitting((prev) => ({ ...prev, [teacherId]: false }));
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === teacherId
          ? {
              ...item,
              teacherVerificationStatus: status,
              teacherReviewNotes: notes[teacherId] || null,
              teacherVerifiedAt: status === "APPROVED" ? new Date().toISOString() : null,
            }
          : item,
      ),
    );
    setSubmitting((prev) => ({ ...prev, [teacherId]: false }));
    pushToast(`Teacher ${status === "APPROVED" ? "approved" : "rejected"}`, "success");
  }

  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return items
      .filter((item) => (statusFilter === "ALL" ? true : item.teacherVerificationStatus === statusFilter))
      .filter((item) => {
        if (!normalized) return true;
        return [item.name, item.email, item.collegeId ?? ""].some((value) => value.toLowerCase().includes(normalized));
      });
  }, [items, search, statusFilter]);

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Admin tools</p>
          <p className="mt-1 text-lg font-semibold text-[rgb(var(--text-primary))]">Teacher verification</p>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            Review teacher requests by College ID and ID photo before granting reviewer access.
          </p>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[260px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              statusFilter === status
                ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))]"
            }`}
          >
            {status === "ALL" ? "All" : status === "PENDING" ? "Pending" : status === "APPROVED" ? "Approved" : "Rejected"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? <p className="text-sm text-[rgb(var(--text-secondary))]">Loading teacher requests...</p> : null}
        {!loading && items.length === 0 ? <p className="text-sm text-[rgb(var(--text-secondary))]">No teacher accounts found.</p> : null}
        {!loading && items.length > 0 && visible.length === 0 ? (
          <p className="text-sm text-[rgb(var(--text-secondary))]">No teacher requests match your filters.</p>
        ) : null}

        {visible.map((item) => {
          const isRejecting = rejectingId === item.id;
          const reviewNoteValue = notes[item.id] ?? item.teacherReviewNotes ?? "";
          return (
            <article
              key={item.id}
              className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                    {item.name} <span className="text-[rgb(var(--text-tertiary))]">·</span>{" "}
                    <span className="font-medium text-[rgb(var(--text-secondary))]">{item.email}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-[rgb(var(--text-secondary))]">
                    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-xs font-semibold">
                      College ID: {item.collegeId || "Not provided"}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-xs font-semibold">
                      Submitted {formatRelativeDate(item.createdAt)}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        item.teacherVerificationStatus === "APPROVED"
                          ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : item.teacherVerificationStatus === "REJECTED"
                            ? "border-red-500/40 bg-red-50 text-red-700 dark:border-red-300/30 dark:bg-red-900/30 dark:text-red-200"
                            : "border-amber-500/40 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-900/30 dark:text-amber-200"
                      }`}
                    >
                      {item.teacherVerificationStatus === "PENDING"
                        ? "Pending"
                        : item.teacherVerificationStatus === "APPROVED"
                          ? "Approved"
                          : item.teacherVerificationStatus === "REJECTED"
                            ? "Rejected"
                            : item.teacherVerificationStatus}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Department: {item.department || "Not provided"}</p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    ID Photo:{" "}
                    {item.teacherCollegeIdImagePath ? (
                      <a
                        href={`/api/admin/teachers/${item.id}/id-photo`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[rgb(var(--primary))] hover:underline"
                      >
                        View submitted ID photo
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    loading={Boolean(submitting[item.id])}
                    className="w-full sm:w-auto"
                    onClick={() => review(item.id, "APPROVED")}
                    disabled={item.teacherVerificationStatus !== "PENDING"}
                  >
                    {submitting[item.id] ? "Saving..." : "Approve"}
                  </Button>
                  {item.teacherVerificationStatus === "PENDING" ? (
                    <Button
                      type="button"
                      variant="danger"
                      loading={Boolean(submitting[item.id])}
                      className="w-full sm:w-auto"
                      onClick={() => setRejectingId((prev) => (prev === item.id ? null : item.id))}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </div>

              {item.teacherVerificationStatus === "PENDING" && isRejecting ? (
                <div className="mt-4 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-4">
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Rejection reason</p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Add a short note so the teacher knows what to fix.</p>
                  <div className="mt-3 space-y-2">
                    <Input
                      value={reviewNoteValue}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="e.g., College ID photo is blurry / missing details"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setRejectingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        loading={Boolean(submitting[item.id])}
                        className="w-full sm:w-auto"
                        onClick={() => review(item.id, "REJECTED")}
                      >
                        {submitting[item.id] ? "Saving..." : "Confirm reject"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : item.teacherReviewNotes ? (
                <p className="mt-3 text-sm text-[rgb(var(--text-secondary))]">Review note: {item.teacherReviewNotes}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </Card>
  );
}
