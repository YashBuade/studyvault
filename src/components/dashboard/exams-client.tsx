"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast-provider";

type Exam = {
  id: number;
  subject: string;
  date: string;
  location?: string | null;
  notes?: string | null;
  status: "UPCOMING" | "COMPLETED";
};

type ApiResponse<T> = { ok: boolean; data?: T; error?: { message: string } };

function toIsoDate(input: string) {
  if (!input.trim()) return "";
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(input.trim());
  if (!match) return "";
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function fromIsoDate(input?: string | null) {
  if (!input) return "";
  const [yyyy, mm, dd] = input.slice(0, 10).split("-");
  if (!yyyy || !mm || !dd) return "";
  return `${dd}-${mm}-${yyyy}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDaysFromToday(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatExamDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const includeYear = now.getFullYear() !== date.getFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function countdownLabel(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const days = diffDaysFromToday(date);
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `in ${days} days`;
  return "Passed";
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all">
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

function SkeletonExams() {
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
              <div className="h-3 w-1/2 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="h-3 w-5/6 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
            </div>
            <div className="h-7 w-20 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExamsClient() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const { pushToast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [search, setSearch] = useState(initialSearch);

  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState<Exam | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<Exam["status"]>("UPCOMING");

  const [completingId, setCompletingId] = useState<number | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);

  const newExamSubjectRef = useRef<HTMLInputElement | null>(null);

  function goToNewExamForm() {
    document.getElementById("new-exam-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => newExamSubjectRef.current?.focus(), 250);
  }

  async function load() {
    setLoading(true);
    setHasError(false);
    try {
      const response = await fetch("/api/exams");
      const payload = (await response.json()) as ApiResponse<Exam[]>;
      if (response.ok && payload.ok && payload.data) {
        setExams(payload.data);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  async function addExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    const isoDate = toIsoDate(date);
    if (!isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      setCreating(false);
      return;
    }

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, date: isoDate, location, notes, status: "UPCOMING" }),
      });
      const payload = (await response.json()) as ApiResponse<Exam>;
      if (response.ok && payload.ok && payload.data) {
        setExams((prev) => [...prev, payload.data!].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setSubject("");
        setDate("");
        setLocation("");
        setNotes("");
        pushToast("Exam added", "success");
      } else {
        pushToast(payload.error?.message ?? "Unable to add exam", "error");
      }
    } finally {
      setCreating(false);
    }
  }

  async function deleteExam() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/exams?id=${pendingDelete}`, { method: "DELETE" });
      if (response.ok) {
        setExams((prev) => prev.filter((item) => item.id !== pendingDelete));
        pushToast("Exam deleted", "success");
      } else {
        pushToast("Unable to delete exam", "error");
      }
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function startEdit(exam: Exam) {
    setEditing(exam);
    setEditSubject(exam.subject);
    setEditDate(fromIsoDate(exam.date));
    setEditLocation(exam.location ?? "");
    setEditNotes(exam.notes ?? "");
    setEditStatus(exam.status);
  }

  async function updateExam() {
    if (!editing) return;
    setSavingEdit(true);
    const isoDate = toIsoDate(editDate);
    if (!isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      setSavingEdit(false);
      return;
    }

    try {
      const response = await fetch("/api/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          subject: editSubject,
          date: isoDate,
          location: editLocation,
          notes: editNotes,
          status: editStatus,
        }),
      });
      const payload = (await response.json()) as ApiResponse<Exam>;
      if (response.ok && payload.ok && payload.data) {
        setExams((prev) => prev.map((item) => (item.id === editing.id ? payload.data! : item)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setEditing(null);
        pushToast("Exam updated", "success");
      } else {
        pushToast(payload.error?.message ?? "Unable to update exam", "error");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function markCompleted(exam: Exam) {
    setCompletingId(exam.id);
    const optimistic = { ...exam, status: "COMPLETED" as const };
    setExams((prev) => prev.map((e) => (e.id === exam.id ? optimistic : e)));

    try {
      const response = await fetch("/api/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: exam.id,
          subject: exam.subject,
          date: exam.date.slice(0, 10),
          location: exam.location ?? "",
          notes: exam.notes ?? "",
          status: "COMPLETED",
        }),
      });
      const payload = (await response.json()) as ApiResponse<Exam>;
      if (!response.ok || !payload.ok || !payload.data) {
        setExams((prev) => prev.map((e) => (e.id === exam.id ? exam : e)));
        pushToast(payload.error?.message ?? "Unable to mark as completed", "error");
        return;
      }
      setExams((prev) => prev.map((e) => (e.id === exam.id ? payload.data! : e)));
      pushToast("Exam marked completed", "success");
    } finally {
      setCompletingId(null);
    }
  }

  const visible = useMemo(() => {
    if (!search.trim()) return exams;
    const normalized = search.toLowerCase();
    return exams.filter((exam) => [exam.subject, exam.location ?? "", exam.notes ?? "", exam.status].some((v) => v.toLowerCase().includes(normalized)));
  }, [exams, search]);

  const upcoming = visible.filter((e) => e.status === "UPCOMING");
  const completed = visible.filter((e) => e.status === "COMPLETED");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Your workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Exams</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Keep exam prep visible with dates, locations, and quick notes.</p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={goToNewExamForm}>
          <Plus size={16} /> Add exam
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <div className="relative w-full max-w-xl">
              <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)] dark:text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exams" className="pl-9" />
            </div>
          </Card>

          {hasError ? (
            <ErrorCard onRetry={() => void load()} />
          ) : loading ? (
            <SkeletonExams />
          ) : exams.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                <CalendarDays size={26} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No exams yet</h3>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Add your first exam to get countdowns and keep your schedule tight.</p>
              <div className="mt-4">
                <Button type="button" className="w-full sm:w-auto" onClick={goToNewExamForm}>
                  Add an exam
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Upcoming Exams</h2>
                </div>
                {upcoming.length === 0 ? (
                  <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                      <CalendarDays size={26} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No upcoming exams</h3>
                    <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Add another exam date to stay prepared.</p>
                    <div className="mt-4">
                      <Button type="button" className="w-full sm:w-auto" onClick={goToNewExamForm}>
                        Add an exam
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((exam) => {
                      const badge = countdownLabel(exam.date);
                      const isToday = badge === "Today!";
                      return (
                        <article
                          key={exam.id}
                          className="relative rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
                        >
                          <div className="absolute right-3 top-3">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                isToday
                                  ? "border-red-500/40 bg-red-50 text-red-700 dark:border-red-300/30 dark:bg-red-900/30 dark:text-red-200"
                                  : badge === "Tomorrow"
                                    ? "border-orange-500/40 bg-orange-50 text-orange-700 dark:border-orange-300/30 dark:bg-orange-900/30 dark:text-orange-200"
                                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-secondary))]"
                              }`}
                            >
                              {isToday ? <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> : null}
                              {badge}
                            </span>
                          </div>

                          <div className="pr-24">
                            <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">{exam.subject}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                              <span>{formatExamDate(exam.date)}</span>
                              {exam.location ? (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={14} />
                                  {exam.location}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {exam.notes ? <p className="mt-3 line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">{exam.notes}</p> : null}

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="secondary"
                              className="w-full sm:w-auto"
                              onClick={() => startEdit(exam)}
                            >
                              <Pencil size={14} /> Edit
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="w-full sm:w-auto"
                              loading={completingId === exam.id}
                              onClick={() => void markCompleted(exam)}
                            >
                              {completingId === exam.id ? "Saving..." : "Mark as completed"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="w-full sm:w-auto"
                              onClick={() => setPendingDelete(exam.id)}
                            >
                              <Trash2 size={14} /> Delete
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3 text-left shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
                  onClick={() => setCompletedOpen((prev) => !prev)}
                >
                  <div>
                    <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">Completed Exams</p>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{completed.length} completed</p>
                  </div>
                  {completedOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {completedOpen ? (
                  completed.length === 0 ? (
                    <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                        <CheckCircle2 size={26} />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No completed exams yet</h3>
                      <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Mark an upcoming exam as completed when you finish it.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {completed.map((exam) => (
                        <article
                          key={exam.id}
                          className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{exam.subject}</p>
                              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{formatExamDate(exam.date)}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/30 dark:text-emerald-200">
                              <CheckCircle2 size={14} />
                              Completed
                            </span>
                          </div>
                          {exam.notes ? <p className="mt-3 line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">{exam.notes}</p> : null}
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => startEdit(exam)}>
                              <Pencil size={14} /> Edit
                            </Button>
                            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setPendingDelete(exam.id)}>
                              <Trash2 size={14} /> Delete
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )
                ) : null}
              </section>
            </div>
          )}
        </div>

        <Card title="New Exam" description="Add an exam with date, location, and notes." className="lg:sticky lg:top-24">
          <form id="new-exam-form" onSubmit={addExam} className="space-y-2">
            <Input ref={newExamSubjectRef} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" required />
            <Input value={date} onChange={(event) => setDate(event.target.value)} placeholder="dd-mm-yyyy" required />
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location (optional)" />
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes (optional)" rows={4} />
            <Button type="submit" loading={creating} className="w-full sm:w-auto">
              {creating ? "Saving..." : "Add exam"}
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        open={pendingDelete !== null}
        title="Delete exam"
        description="This action cannot be undone."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteExam}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />

      <Modal
        open={editing !== null}
        title="Edit exam"
        description="Update exam details."
        onClose={() => setEditing(null)}
        onConfirm={updateExam}
        confirmLabel={savingEdit ? "Saving..." : "Save changes"}
      >
        <div className="space-y-2">
          <Input value={editSubject} onChange={(event) => setEditSubject(event.target.value)} placeholder="Subject" />
          <Input value={editDate} onChange={(event) => setEditDate(event.target.value)} placeholder="dd-mm-yyyy" />
          <Input value={editLocation} onChange={(event) => setEditLocation(event.target.value)} placeholder="Location" />
          <Textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} placeholder="Notes" rows={3} />
          <Select
            label="Status"
            value={editStatus}
            onChange={(event) => setEditStatus(event.target.value as Exam["status"])}
            options={[
              { label: "Upcoming", value: "UPCOMING" },
              { label: "Completed", value: "COMPLETED" },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

