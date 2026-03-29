"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ClipboardList, Pencil, Plus, Search } from "lucide-react";
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

function parseIsoDate(input?: string | null) {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDaysFromToday(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function getEffectiveStatus(item: Assignment) {
  if (item.status === "COMPLETED") return "COMPLETED" as const;
  const due = parseIsoDate(item.dueDate);
  if (due && diffDaysFromToday(due) < 0) return "OVERDUE" as const;
  return "PENDING" as const;
}

function dueUrgency(item: Assignment) {
  const due = parseIsoDate(item.dueDate);
  if (!due) return { label: "No due date", className: "text-[rgb(var(--text-tertiary))]" };
  const days = diffDaysFromToday(due);
  if (days === 0) return { label: "Due today", className: "text-red-600 font-semibold dark:text-red-300" };
  if (days === 1) return { label: "Due tomorrow", className: "text-orange-500 dark:text-orange-300" };
  if (days >= 2 && days <= 3) return { label: `Due in ${days} days`, className: "text-yellow-600 dark:text-yellow-300" };
  if (days < 0) return { label: "Overdue", className: "text-red-600 font-semibold dark:text-red-300" };
  return { label: `Due ${formatRelativeDate(item.dueDate)}`, className: "text-[rgb(var(--text-tertiary))]" };
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

function SkeletonAssignments() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-4 w-2/3 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="h-3 w-36 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="h-3 w-5/6 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="h-7 w-20 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssignmentsClient() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const { pushToast } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED" | "OVERDUE">("ALL");
  const [search, setSearch] = useState(initialSearch);
  const [sortMode, setSortMode] = useState<"dueDate" | "priority">("dueDate");

  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState<Assignment | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<Assignment["status"]>("PENDING");
  const [editPriority, setEditPriority] = useState<Assignment["priority"]>("MEDIUM");

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Assignment["priority"]>("MEDIUM");

  const [completingId, setCompletingId] = useState<number | null>(null);

  const newAssignmentTitleRef = useRef<HTMLInputElement | null>(null);

  function goToNewAssignmentForm() {
    document.getElementById("new-assignment-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => newAssignmentTitleRef.current?.focus(), 250);
  }

  async function load() {
    setLoading(true);
    setHasError(false);
    try {
      const response = await fetch("/api/assignments");
      const payload = (await response.json()) as ApiResponse<Assignment[]>;
      if (response.ok && payload.ok && payload.data) {
        setAssignments(payload.data);
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

  async function addAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    const isoDate = toIsoDate(dueDate);
    if (dueDate && !isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      setCreating(false);
      return;
    }

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dueDate: isoDate,
          status: "PENDING",
          priority,
        }),
      });
      const payload = (await response.json()) as ApiResponse<Assignment>;
      if (response.ok && payload.ok && payload.data) {
        setAssignments((prev) => [payload.data!, ...prev]);
        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority("MEDIUM");
        pushToast("Assignment added", "success");
      } else {
        pushToast(payload.error?.message ?? "Unable to add assignment", "error");
      }
    } finally {
      setCreating(false);
    }
  }

  async function deleteAssignment() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/assignments?id=${pendingDelete}`, { method: "DELETE" });
      if (response.ok) {
        setAssignments((prev) => prev.filter((item) => item.id !== pendingDelete));
        pushToast("Assignment deleted", "success");
      } else {
        pushToast("Unable to delete assignment", "error");
      }
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
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
    setSavingEdit(true);
    const isoDate = toIsoDate(editDueDate);
    if (editDueDate && !isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      setSavingEdit(false);
      return;
    }

    try {
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
      } else {
        pushToast(payload.error?.message ?? "Unable to update assignment", "error");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function markAsDone(assignment: Assignment) {
    setCompletingId(assignment.id);
    const optimistic = { ...assignment, status: "COMPLETED" as const };
    setAssignments((prev) => prev.map((a) => (a.id === assignment.id ? optimistic : a)));

    try {
      const response = await fetch("/api/assignments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description ?? "",
          dueDate: assignment.dueDate ?? "",
          status: "COMPLETED",
          priority: assignment.priority,
        }),
      });
      const payload = (await response.json()) as ApiResponse<Assignment>;
      if (!response.ok || !payload.ok || !payload.data) {
        setAssignments((prev) => prev.map((a) => (a.id === assignment.id ? assignment : a)));
        pushToast(payload.error?.message ?? "Unable to mark as done", "error");
        return;
      }
      setAssignments((prev) => prev.map((a) => (a.id === assignment.id ? payload.data! : a)));
      pushToast("Marked as done", "success");
    } finally {
      setCompletingId(null);
    }
  }

  const summary = useMemo(() => {
    const pending = assignments.filter((a) => getEffectiveStatus(a) === "PENDING").length;
    const completed = assignments.filter((a) => getEffectiveStatus(a) === "COMPLETED").length;
    const overdue = assignments.filter((a) => getEffectiveStatus(a) === "OVERDUE").length;
    return { pending, completed, overdue };
  }, [assignments]);

  const visible = useMemo(() => {
    return assignments
      .map((item) => ({ item, effectiveStatus: getEffectiveStatus(item) }))
      .filter(({ effectiveStatus }) => (filter === "ALL" ? true : effectiveStatus === filter))
      .filter(({ item, effectiveStatus }) => {
        if (!search.trim()) return true;
        const normalized = search.toLowerCase();
        return [item.title, item.description ?? "", effectiveStatus, item.priority].some((value) => value.toLowerCase().includes(normalized));
      })
      .map((v) => v.item);
  }, [assignments, filter, search]);

  const sortedVisible = useMemo(() => {
    const priorityRank: Record<Assignment["priority"], number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const statusRank = (a: Assignment) => {
      const s = getEffectiveStatus(a);
      if (s === "OVERDUE") return 0;
      if (s === "PENDING") return 1;
      return 2;
    };
    const dueRank = (a: Assignment) => {
      const due = parseIsoDate(a.dueDate);
      return due ? startOfDay(due).getTime() : Number.POSITIVE_INFINITY;
    };

    return [...visible].sort((a, b) => {
      const sr = statusRank(a) - statusRank(b);
      if (sr !== 0) return sr;

      if (sortMode === "priority") {
        const pr = priorityRank[a.priority] - priorityRank[b.priority];
        if (pr !== 0) return pr;
      }

      const dr = dueRank(a) - dueRank(b);
      if (dr !== 0) return dr;
      return b.id - a.id;
    });
  }, [sortMode, visible]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Your workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Assignments</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Track deadlines, priorities, and completion.</p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={goToNewAssignmentForm}>
          <Plus size={16} /> Add assignment
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Pending", value: summary.pending, icon: ClipboardList },
          { label: "Completed", value: summary.completed, icon: CheckCircle2 },
          { label: "Overdue", value: summary.overdue, icon: AlertCircle },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                <stat.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="relative w-full">
                <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assignments" className="pl-9" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "PENDING", "COMPLETED", "OVERDUE"] as const).map((option) => (
                  <Button key={option} type="button" variant={filter === option ? "primary" : "secondary"} onClick={() => setFilter(option)}>
                    {option === "ALL" ? "All" : option === "PENDING" ? "Pending" : option === "COMPLETED" ? "Done" : "Overdue"}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="button" variant={sortMode === "dueDate" ? "primary" : "secondary"} onClick={() => setSortMode("dueDate")}>
                  By due date
                </Button>
                <Button type="button" variant={sortMode === "priority" ? "primary" : "secondary"} onClick={() => setSortMode("priority")}>
                  By priority
                </Button>
              </div>
            </div>
          </Card>

          {hasError ? (
            <ErrorCard onRetry={() => void load()} />
          ) : loading ? (
            <SkeletonAssignments />
          ) : assignments.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                <ClipboardList size={26} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No assignments yet</h3>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Add your first assignment to start tracking deadlines and stay on schedule.</p>
              <div className="mt-4">
                <Button type="button" className="w-full sm:w-auto" onClick={goToNewAssignmentForm}>
                  Add an assignment
                </Button>
              </div>
            </div>
          ) : sortedVisible.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                <Search size={22} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No assignments match</h3>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Try a different search or clear the filters.</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setSearch("")} disabled={!search.trim()}>
                  Clear search
                </Button>
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setFilter("ALL")} disabled={filter === "ALL"}>
                  Reset filter
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVisible.map((item) => {
                const effectiveStatus = getEffectiveStatus(item);
                const urgency = dueUrgency(item);
                return (
                  <div
                    key={item.id}
                    className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{item.title}</p>
                        <p className={`mt-1 text-xs ${urgency.className}`}>{urgency.label}</p>
                        {item.description ? (
                          <p className="mt-2 line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">{item.description}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.priority === "HIGH"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                                : item.priority === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                            }`}
                          >
                            {item.priority}
                          </span>

                          {effectiveStatus === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/30 dark:text-emerald-200">
                              <CheckCircle2 size={14} />
                              Done
                            </span>
                          ) : effectiveStatus === "OVERDUE" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-300/30 dark:bg-red-900/30 dark:text-red-200">
                              <AlertCircle size={14} />
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                          {effectiveStatus !== "COMPLETED" ? (
                            <Button
                              type="button"
                              variant="secondary"
                              loading={completingId === item.id}
                              className="w-full sm:w-auto"
                              onClick={() => void markAsDone(item)}
                            >
                              {completingId === item.id ? "Saving..." : "Mark as done"}
                            </Button>
                          ) : null}
                          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => startEdit(item)}>
                            <Pencil size={14} /> Edit
                          </Button>
                          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setPendingDelete(item.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Card title="New Assignment" description="Add tasks with priority and due dates." className="lg:sticky lg:top-24">
          <form id="new-assignment-form" onSubmit={addAssignment} className="space-y-2">
            <Input ref={newAssignmentTitleRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Assignment title" required />
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" rows={4} />
            <Input value={dueDate} onChange={(event) => setDueDate(event.target.value)} placeholder="dd-mm-yyyy" />
            <Select
              label="Priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as Assignment["priority"])}
              options={[
                { label: "High", value: "HIGH" },
                { label: "Medium", value: "MEDIUM" },
                { label: "Low", value: "LOW" },
              ]}
            />
            <Button type="submit" loading={creating} className="w-full sm:w-auto">
              {creating ? "Saving..." : "Add assignment"}
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        open={pendingDelete !== null}
        title="Delete assignment"
        description="This action cannot be undone."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteAssignment}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />

      <Modal
        open={editing !== null}
        title="Edit assignment"
        description="Update assignment details."
        onClose={() => setEditing(null)}
        onConfirm={updateAssignment}
        confirmLabel={savingEdit ? "Saving..." : "Save changes"}
      >
        <div className="space-y-2">
          <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Assignment title" />
          <Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} placeholder="Description" rows={3} />
          <Input value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} placeholder="dd-mm-yyyy" />
          <Select
            label="Priority"
            value={editPriority}
            onChange={(event) => setEditPriority(event.target.value as Assignment["priority"])}
            options={[
              { label: "High", value: "HIGH" },
              { label: "Medium", value: "MEDIUM" },
              { label: "Low", value: "LOW" },
            ]}
          />
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
        </div>
      </Modal>
    </div>
  );
}

