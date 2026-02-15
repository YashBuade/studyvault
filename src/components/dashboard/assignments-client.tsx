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
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate, status, priority }),
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
    setEditDueDate(assignment.dueDate ? assignment.dueDate.slice(0, 10) : "");
    setEditStatus(assignment.status);
    setEditPriority(assignment.priority);
  }

  async function updateAssignment() {
    if (!editing) return;
    const response = await fetch("/api/assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate,
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

  return (
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
              <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
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
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
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
          <Input type="date" value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} />
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
  );
}
