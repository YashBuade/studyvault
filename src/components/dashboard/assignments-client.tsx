"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ClipboardList, Pencil, Search } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast-provider";

type Assignment = {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: "PENDING" | "COMPLETED" | "OVERDUE";
  priority: "LOW" | "MEDIUM" | "HIGH";
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

export function AssignmentsClient() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Assignment["status"]>("PENDING");
  const [priority, setPriority] = useState<Assignment["priority"]>("MEDIUM");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState(initialSearch);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<Assignment["status"]>("PENDING");
  const [editPriority, setEditPriority] = useState<Assignment["priority"]>("MEDIUM");
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/assignments");
      const payload = (await response.json()) as ApiResponse<Assignment[]>;
      if (response.ok && payload.ok && payload.data) {
        setAssignments(payload.data);
      }
      setLoading(false);
    }

    void load();
  }, []);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  async function addAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isoDate = toIsoDate(dueDate);
    if (dueDate && !isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      return;
    }
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate: isoDate, status, priority }),
    });

    const payload = (await response.json()) as ApiResponse<Assignment>;
    if (response.ok && payload.ok && payload.data) {
      setAssignments((prev) => [payload.data!, ...prev]);
      setTitle("");
      setDescription("");
      setDueDate("");
      pushToast("Assignment added", "success");
    }
  }

  async function deleteAssignment() {
    if (!pendingDelete) return;
    const response = await fetch(`/api/assignments?id=${pendingDelete}`, { method: "DELETE" });
    if (response.ok) {
      setAssignments((prev) => prev.filter((item) => item.id !== pendingDelete));
      pushToast("Assignment deleted", "info");
    }
    setPendingDelete(null);
  }

  function startEdit(assignment: Assignment) {
    setEditing(assignment);
    setEditTitle(assignment.title);
    setEditDescription(assignment.description ?? "");
    setEditDueDate(fromIsoDate(assignment.dueDate));
    setEditStatus(assignment.status);
    setEditPriority(assignment.priority);
  }

  async function updateAssignment() {
    if (!editing) return;
    const isoDate = toIsoDate(editDueDate);
    if (editDueDate && !isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      return;
    }
    const response = await fetch("/api/assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        title: editTitle,
        description: editDescription,
        dueDate: isoDate,
        status: editStatus,
        priority: editPriority,
      }),
    });

    const payload = (await response.json()) as ApiResponse<Assignment>;
    if (response.ok && payload.ok && payload.data) {
      setAssignments((prev) => prev.map((item) => (item.id === editing.id ? payload.data! : item)));
      setEditing(null);
      pushToast("Assignment updated", "success");
    }
  }

  const visible = useMemo(
    () =>
      assignments
        .filter((item) => (filter === "ALL" ? true : item.status === filter))
        .filter((item) => {
          if (!search.trim()) return true;
          const normalized = search.toLowerCase();
          return [item.title, item.description ?? "", item.status, item.priority].some((value) =>
            value.toLowerCase().includes(normalized),
          );
        }),
    [assignments, filter, search],
  );

  const summary = useMemo(() => {
    const pending = assignments.filter((a) => a.status === "PENDING").length;
    const completed = assignments.filter((a) => a.status === "COMPLETED").length;
    const overdue = assignments.filter((a) => a.status === "OVERDUE").length;
    return { pending, completed, overdue };
  }, [assignments]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,rgb(var(--color-warning-light))_0%,rgb(var(--surface))_100%)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{summary.pending}</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,rgb(var(--color-success-light))_0%,rgb(var(--surface))_100%)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{summary.completed}</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,rgb(var(--color-danger-light))_0%,rgb(var(--surface))_100%)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Overdue</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{summary.overdue}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card title="Assignments" description="Track deadlines, status, and priority.">
        <div className="mb-3 flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)] dark:text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assignments" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
          {["ALL", "PENDING", "COMPLETED", "OVERDUE"].map((option) => (
            <Button
              key={option}
              variant={filter === option ? "primary" : "secondary"}
              onClick={() => setFilter(option)}
            >
              {option}
            </Button>
          ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading assignments...</p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/60 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
              <ClipboardList size={24} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">{search.trim() ? "No matching assignments" : "No assignments yet"}</h3>
            <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
              {search.trim() ? "Try a different keyword or clear the search." : "Add your first assignment to keep deadlines visible and under control."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => (
              <div key={item.id} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/95 p-3 shadow-[var(--shadow-xs)] transition hover:border-[rgb(var(--primary))]/25 hover:shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-[var(--muted)]">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No due date"}</p>
                    {item.description ? <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{item.description}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.priority === "HIGH" ? "danger" : item.priority === "LOW" ? "info" : "neutral"}>
                      {item.priority}
                    </Badge>
                    <span className={`badge ${item.status === "COMPLETED" ? "badge-success" : item.status === "OVERDUE" ? "badge-error" : ""}`}>
                      {item.status === "COMPLETED" ? <CheckCircle2 size={12} /> : null}
                      {item.status}
                    </span>
                    <Button variant="secondary" onClick={() => startEdit(item)}>
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="secondary" onClick={() => setPendingDelete(item.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="New Assignment" description="Add tasks with priority and status." className="lg:sticky lg:top-24">
        <form onSubmit={addAssignment} className="space-y-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Assignment title" />
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" rows={4} />
          <Input value={dueDate} onChange={(event) => setDueDate(event.target.value)} placeholder="dd-mm-yyyy" />
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as Assignment["status"])}
            options={[
              { label: "Pending", value: "PENDING" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Overdue", value: "OVERDUE" },
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Assignment["priority"])}
            options={[
              { label: "Low", value: "LOW" },
              { label: "Medium", value: "MEDIUM" },
              { label: "High", value: "HIGH" },
            ]}
          />
          <Button type="submit">Add Assignment</Button>
        </form>
      </Card>

      <Modal
        open={pendingDelete !== null}
        title="Delete assignment"
        description="This action cannot be undone."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteAssignment}
        danger
      />

      <Modal
        open={editing !== null}
        title="Edit assignment"
        description="Update assignment details."
        onClose={() => setEditing(null)}
        onConfirm={updateAssignment}
        confirmLabel="Save changes"
      >
        <div className="space-y-2">
          <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Assignment title" />
          <Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} placeholder="Description" rows={3} />
          <Input value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} placeholder="dd-mm-yyyy" />
          <Select
            label="Status"
            value={editStatus}
            onChange={(event) => setEditStatus(event.target.value as Assignment["status"])}
            options={[
              { label: "Pending", value: "PENDING" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Overdue", value: "OVERDUE" },
            ]}
          />
          <Select
            label="Priority"
            value={editPriority}
            onChange={(event) => setEditPriority(event.target.value as Assignment["priority"])}
            options={[
              { label: "Low", value: "LOW" },
              { label: "Medium", value: "MEDIUM" },
              { label: "High", value: "HIGH" },
            ]}
          />
        </div>
      </Modal>
      </div>
    </div>
  );
}
