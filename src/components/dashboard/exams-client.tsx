"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Pencil, Sparkles } from "lucide-react";
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

export function ExamsClient() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Exam["status"]>("UPCOMING");
  const [filter, setFilter] = useState("ALL");
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

  async function addExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, date, location, notes, status }),
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
    setEditDate(exam.date.slice(0, 10));
    setEditLocation(exam.location ?? "");
    setEditNotes(exam.notes ?? "");
    setEditStatus(exam.status);
  }

  async function updateExam() {
    if (!editing) return;
    const response = await fetch("/api/exams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        subject: editSubject,
        date: editDate,
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
    () => exams.filter((item) => (filter === "ALL" ? true : item.status === filter)),
    [exams, filter],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Card title="Exams" description="Keep exam prep visible and prioritized.">
          <div className="mb-3 flex flex-wrap gap-2">
            {["ALL", "UPCOMING", "COMPLETED"].map((option) => (
              <Button key={option} variant={filter === option ? "primary" : "secondary"} onClick={() => setFilter(option)}>
                {option}
              </Button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading exams...</p>
          ) : visible.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No exams yet. Add your first one to start tracking.</p>
          ) : (
            <div className="space-y-3">
              {visible.map((item) => {
                const examDate = new Date(item.date);
                const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const urgency =
                  item.status === "COMPLETED"
                    ? "Completed"
                    : daysLeft < 0
                      ? "Overdue"
                      : daysLeft <= 7
                        ? "Soon"
                        : "Upcoming";

                return (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
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
            <div className="rounded-full border border-[var(--border)] bg-[var(--panel)] p-2 text-[var(--primary)]">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold">Exam prep flow</p>
              <p className="text-xs text-[var(--muted)]">Set due dates to highlight urgent exams automatically.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="New Exam" description="Add subject, date, and notes.">
        <form onSubmit={addExam} className="space-y-2">
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
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
          <Input type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} />
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
