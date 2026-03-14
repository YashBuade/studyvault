"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, MapPin, Pencil, Search, Sparkles } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
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

export function ExamsClient() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const [today, setToday] = useState<Date>(() => new Date());
  const [exams, setExams] = useState<Exam[]>([]);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Exam["status"]>("UPCOMING");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState(initialSearch);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<Exam["status"]>("UPCOMING");
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/exams");
      const payload = (await response.json()) as ApiResponse<Exam[]>;

      if (response.ok && payload.ok && payload.data) {
        setExams(payload.data);
      } else {
        pushToast(payload.error?.message ?? "Unable to load exams", "error");
      }

      setLoading(false);
    }

    void load();
  }, [pushToast]);

  useEffect(() => {
    const id = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  async function addExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isoDate = toIsoDate(date);
    if (!isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      return;
    }
    const response = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, date: isoDate, location, notes, status }),
    });

    const payload = (await response.json()) as ApiResponse<Exam>;
    if (response.ok && payload.ok && payload.data) {
      setExams((prev) => [payload.data!, ...prev]);
      setSubject("");
      setDate("");
      setLocation("");
      setNotes("");
      setStatus("UPCOMING");
      pushToast("Exam added", "success");
    }
  }

  async function deleteExam() {
    if (!pendingDelete) return;
    const response = await fetch(`/api/exams?id=${pendingDelete}`, { method: "DELETE" });
    if (response.ok) {
      setExams((prev) => prev.filter((item) => item.id !== pendingDelete));
      pushToast("Exam deleted", "info");
    }
    setPendingDelete(null);
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
    const isoDate = toIsoDate(editDate);
    if (!isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      return;
    }
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
      setExams((prev) => prev.map((item) => (item.id === editing.id ? payload.data! : item)));
      setEditing(null);
      pushToast("Exam updated", "success");
    }
  }

  const visible = useMemo(
    () =>
      exams
        .filter((item) => (filter === "ALL" ? true : item.status === filter))
        .filter((item) => {
          if (!search.trim()) return true;
          const normalized = search.toLowerCase();
          return [item.subject, item.location ?? "", item.notes ?? "", item.status].some((value) =>
            value.toLowerCase().includes(normalized),
          );
        }),
    [exams, filter, search],
  );

  const examSummary = useMemo(() => {
    const upcoming = exams.filter((item) => item.status === "UPCOMING").length;
    const completed = exams.filter((item) => item.status === "COMPLETED").length;
    return { upcoming, completed };
  }, [exams]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,rgb(var(--color-primary-light))_0%,rgb(var(--surface))_100%)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Upcoming Exams</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{examSummary.upcoming}</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,rgb(var(--color-success-light))_0%,rgb(var(--surface))_100%)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Completed Exams</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{examSummary.completed}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Card title="Exams" description="Keep exam prep visible and prioritized.">
          <div className="mb-3 flex flex-col gap-3">
            <div className="relative max-w-md">
              <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)] dark:text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exams" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
            {["ALL", "UPCOMING", "COMPLETED"].map((option) => (
              <Button key={option} variant={filter === option ? "primary" : "secondary"} onClick={() => setFilter(option)}>
                {option}
              </Button>
            ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading exams...</p>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/60 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
                <CalendarDays size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">{search.trim() ? "No matching exams" : "No exams yet"}</h3>
              <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
                {search.trim() ? "Try another keyword or clear the search." : "Add your first exam date so revision windows and urgency stay visible."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((item) => {
                const examDate = new Date(item.date);
                const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const urgency =
                  item.status === "COMPLETED"
                    ? "Completed"
                    : daysLeft < 0
                      ? "Overdue"
                      : daysLeft <= 7
                        ? "Soon"
                        : "Upcoming";

                return (
                  <div key={item.id} className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/95 p-4 shadow-[var(--shadow-xs)] transition hover:border-[rgb(var(--primary))]/25 hover:shadow-[var(--shadow-sm)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold">{item.subject}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                          <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{examDate.toLocaleDateString()}</span>
                          {item.location ? <span className="inline-flex items-center gap-1"><MapPin size={12} />{item.location}</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === "UPCOMING" ? "info" : "neutral"}>{item.status}</Badge>
                        <Badge variant={urgency === "Soon" || urgency === "Overdue" ? "warning" : "neutral"}>{urgency}</Badge>
                        <Button variant="secondary" onClick={() => startEdit(item)}>
                          <Pencil size={14} /> Edit
                        </Button>
                        <Button variant="secondary" onClick={() => setPendingDelete(item.id)}>Delete</Button>
                      </div>
                    </div>
                    {item.notes ? (
                      <p className="mt-3 text-sm text-[var(--muted)]">{item.notes}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2 text-[var(--primary)]">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold">Exam prep flow</p>
              <p className="text-xs text-[var(--muted)]">Set due dates to highlight urgent exams automatically.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="New Exam" description="Add subject, date, and notes." className="lg:sticky lg:top-24">
        <form onSubmit={addExam} className="space-y-2">
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
          <Input value={date} onChange={(event) => setDate(event.target.value)} placeholder="dd-mm-yyyy" />
          <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" />
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" rows={3} />
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as Exam["status"])}
            options={[
              { label: "Upcoming", value: "UPCOMING" },
              { label: "Completed", value: "COMPLETED" },
            ]}
          />
          <Button type="submit">Add Exam</Button>
        </form>
      </Card>

      <Modal
        open={pendingDelete !== null}
        title="Delete exam"
        description="This action cannot be undone."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteExam}
        danger
      />

      <Modal
        open={editing !== null}
        title="Edit exam"
        description="Update exam details."
        onClose={() => setEditing(null)}
        onConfirm={updateExam}
        confirmLabel="Save changes"
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
    </div>
  );
}
