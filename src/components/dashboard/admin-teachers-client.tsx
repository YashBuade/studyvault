"use client";

import { useEffect, useState } from "react";
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
  createdAt: string;
  teacherReviewedBy?: { id: number; name: string; email: string } | null;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string };
};

export function AdminTeachersClient() {
  const [items, setItems] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
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

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        <p className="text-sm font-semibold">Teacher requests</p>
          <p className="text-xs text-[var(--muted)]">Validate each teacher by College ID and expertise before granting reviewer access.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
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
        {loading ? <p className="text-sm text-[var(--muted)]">Loading teacher requests...</p> : null}
        {!loading && items.length === 0 ? <p className="text-sm text-[var(--muted)]">No teacher accounts found.</p> : null}
        {items
          .filter((item) => (statusFilter === "ALL" ? true : item.teacherVerificationStatus === statusFilter))
          .map((item) => (
          <article key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-[var(--muted)]">{item.email}</p>
                <p className="text-xs text-[var(--muted)]">College ID: {item.collegeId || "Not provided"}</p>
                <p className="text-xs text-[var(--muted)]">Expertise: {item.department || "Not provided"}</p>
                <p className="text-xs text-[var(--muted)]">Status: {item.teacherVerificationStatus}</p>
              </div>
              {item.teacherVerificationStatus === "PENDING" ? (
                <span className="rounded-full border border-amber-400/70 bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  Needs validation
                </span>
              ) : null}
            </div>

            <div className="mt-3 space-y-2">
              <Input
                value={notes[item.id] ?? item.teacherReviewNotes ?? ""}
                onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
                placeholder="Optional admin review note"
              />
              <div className="flex items-center gap-2">
                <Button loading={Boolean(submitting[item.id])} onClick={() => review(item.id, "APPROVED")}>
                  Approve
                </Button>
                <Button
                  variant="danger"
                  loading={Boolean(submitting[item.id])}
                  onClick={() => review(item.id, "REJECTED")}
                >
                  Reject
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
