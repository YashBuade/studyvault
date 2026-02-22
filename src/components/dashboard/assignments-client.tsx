"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Assignment["status"]>("PENDING");
  const [priority, setPriority] = useState<Assignment["priority"]>("MEDIUM");
  const [filter, setFilter] = useState("ALL");
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
    () => assignments.filter((item) => (filter === "ALL" ? true : item.status === filter)),
    [assignments, filter],
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
        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-gradient-to-br from-amber-500/15 to-orange-600/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{summary.pending}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-gradient-to-br from-emerald-500/15 to-green-600/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{summary.completed}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-gradient-to-br from-rose-500/15 to-red-600/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Overdue</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{summary.overdue}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card title="Assignments" description="Track deadlines, status, and priority.">
        <div className="mb-3 flex flex-wrap gap-2">
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

        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading assignments...</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No assignments yet.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => (
              <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-[var(--muted)]">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No due date"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.priority === "HIGH" ? "danger" : item.priority === "LOW" ? "info" : "neutral"}>
                      {item.priority}
                    </Badge>
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

      <Card title="New Assignment" description="Add tasks with priority and status.">
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
