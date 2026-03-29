"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast-provider";

type Category = { id: number; name: string; color: string };

type Item = {
  id: number;
  title: string;
  details?: string | null;
  dueDate?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  order: number;
  categoryId?: number | null;
  updatedAt: string;
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

function dueUrgency(item: Item) {
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

function SkeletonBoard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4"
        >
          <div className="h-4 w-24 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((__, row) => (
              <div key={row} className="rounded-[var(--radius-lg)] bg-[rgb(var(--surface-hover))] h-16 animate-shimmer" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlannerClient() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const { pushToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [search, setSearch] = useState(initialSearch);

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<Item["priority"]>("MEDIUM");
  const [status, setStatus] = useState<Item["status"]>("TODO");
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const [creatingItem, setCreatingItem] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editPriority, setEditPriority] = useState<Item["priority"]>("MEDIUM");
  const [editStatus, setEditStatus] = useState<Item["status"]>("TODO");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");

  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const newItemTitleRef = useRef<HTMLInputElement | null>(null);

  function goToNewItemForm() {
    document.getElementById("new-planner-item-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => newItemTitleRef.current?.focus(), 250);
  }

  async function load() {
    setLoading(true);
    setHasError(false);
    try {
      const [catRes, itemRes] = await Promise.all([fetch("/api/planner/categories"), fetch("/api/planner/items")]);
      const catPayload = (await catRes.json()) as ApiResponse<Category[]>;
      const itemPayload = (await itemRes.json()) as ApiResponse<Item[]>;
      if (catRes.ok && catPayload.ok && catPayload.data) setCategories(catPayload.data);
      if (itemRes.ok && itemPayload.ok && itemPayload.data) setItems(itemPayload.data);
      if (!catRes.ok || !itemRes.ok || !catPayload.ok || !itemPayload.ok) setHasError(true);
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

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingCategory(true);
    try {
      const response = await fetch("/api/planner/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });
      const payload = (await response.json()) as ApiResponse<Category>;
      if (!response.ok || !payload.ok || !payload.data) {
        pushToast(payload.error?.message ?? "Unable to create category", "error");
        return;
      }
      setCategories((prev) => [...prev, payload.data!]);
      setNewCategory("");
      pushToast("Category added", "success");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingItem(true);
    const isoDate = toIsoDate(dueDate);
    if (dueDate && !isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      setCreatingItem(false);
      return;
    }
    try {
      const response = await fetch("/api/planner/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          details,
          dueDate: isoDate || undefined,
          priority,
          status,
          categoryId: categoryId ? Number(categoryId) : null,
        }),
      });
      const payload = (await response.json()) as ApiResponse<Item>;
      if (!response.ok || !payload.ok || !payload.data) {
        pushToast(payload.error?.message ?? "Unable to create task", "error");
        return;
      }
      setItems((prev) => [...prev, payload.data!]);
      setTitle("");
      setDetails("");
      setDueDate("");
      setCategoryId("");
      setPriority("MEDIUM");
      setStatus("TODO");
      pushToast("Planner item created", "success");
    } finally {
      setCreatingItem(false);
    }
  }

  async function deleteItem() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/planner/items?id=${pendingDelete}`, { method: "DELETE" });
      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== pendingDelete));
        pushToast("Planner item deleted", "success");
      } else {
        pushToast("Unable to delete item", "error");
      }
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function startEditItem(item: Item) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDetails(item.details ?? "");
    setEditPriority(item.priority);
    setEditStatus(item.status);
    setEditDueDate(fromIsoDate(item.dueDate));
    setEditCategoryId(item.categoryId ? String(item.categoryId) : "");
  }

  async function updateItem() {
    if (!editingItem) return;
    setSavingItem(true);
    const isoDate = toIsoDate(editDueDate);
    if (editDueDate && !isoDate) {
      pushToast("Use date format dd-mm-yyyy", "error");
      setSavingItem(false);
      return;
    }
    try {
      const response = await fetch("/api/planner/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          title: editTitle,
          details: editDetails,
          dueDate: isoDate || undefined,
          priority: editPriority,
          status: editStatus,
          categoryId: editCategoryId ? Number(editCategoryId) : null,
        }),
      });
      const payload = (await response.json()) as ApiResponse<Item>;
      if (!response.ok || !payload.ok || !payload.data) {
        pushToast(payload.error?.message ?? "Unable to update item", "error");
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === editingItem.id ? payload.data! : item)));
      setEditingItem(null);
      pushToast("Planner item updated", "success");
    } finally {
      setSavingItem(false);
    }
  }

  async function setItemStatus(item: Item, nextStatus: Item["status"]) {
    setUpdatingStatusId(item.id);
    const previous = item;
    const optimistic = { ...item, status: nextStatus };
    setItems((prev) => prev.map((i) => (i.id === item.id ? optimistic : i)));

    try {
      const response = await fetch("/api/planner/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          details: item.details ?? "",
          dueDate: item.dueDate ?? undefined,
          priority: item.priority,
          status: nextStatus,
          categoryId: item.categoryId ?? null,
        }),
      });
      const payload = (await response.json()) as ApiResponse<Item>;
      if (!response.ok || !payload.ok || !payload.data) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? previous : i)));
        pushToast(payload.error?.message ?? "Unable to update status", "error");
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === item.id ? payload.data! : i)));
      pushToast("Task updated", "success");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const normalized = search.toLowerCase();
    return items.filter((item) => [item.title, item.details ?? "", item.status, item.priority].some((v) => v.toLowerCase().includes(normalized)));
  }, [items, search]);

  const columns = useMemo(() => {
    const byStatus: Record<Item["status"], Item[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    filteredItems.forEach((item) => byStatus[item.status].push(item));
    (Object.keys(byStatus) as Item["status"][]).forEach((key) => byStatus[key].sort((a, b) => a.order - b.order));
    return byStatus;
  }, [filteredItems]);

  const weekProgress = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const recent = items.filter((item) => {
      const updated = new Date(item.updatedAt);
      return !Number.isNaN(updated.getTime()) && updated >= sevenDaysAgo;
    });
    const completed = recent.filter((item) => item.status === "DONE").length;
    return { completed, total: recent.length };
  }, [items]);

  const weekPct = weekProgress.total > 0 ? Math.round((weekProgress.completed / weekProgress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Your workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Planner</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Organize tasks into clear stages and keep deadlines visible.</p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={goToNewItemForm}>
          <Plus size={16} /> New task
        </Button>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {weekProgress.completed} of {weekProgress.total} tasks completed this week
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Based on tasks updated in the last 7 days.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))]">
            <Clock size={16} /> {weekPct}%
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-hover))]">
          <div className="h-full bg-[rgb(var(--primary))] transition-all" style={{ width: `${weekPct}%` }} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <div className="relative w-full max-w-xl">
              <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" className="pl-9" />
            </div>
          </Card>

          {hasError ? (
            <ErrorCard onRetry={() => void load()} />
          ) : loading ? (
            <SkeletonBoard />
          ) : items.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                <AlertCircle size={26} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">Nothing planned yet</h3>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Add your first task so your week starts to take shape.</p>
              <div className="mt-4">
                <Button type="button" className="w-full sm:w-auto" onClick={goToNewItemForm}>
                  Add a task
                </Button>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                <Search size={22} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No tasks match</h3>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Try a different keyword or clear the search.</p>
              <div className="mt-4">
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: "TODO" as const, label: "To Do" },
                { key: "IN_PROGRESS" as const, label: "In Progress" },
                { key: "DONE" as const, label: "Done" },
              ].map((col) => (
                <div
                  key={col.key}
                  className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{col.label}</p>
                    <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
                      {columns[col.key].length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {columns[col.key].map((item) => {
                      const urgency = dueUrgency(item);
                      const category = item.categoryId ? categoryById.get(item.categoryId) : null;
                      return (
                        <div
                          key={item.id}
                          className="group rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{item.title}</p>
                              {category ? (
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                                  {category.name}
                                </div>
                              ) : null}
                              <p className={`mt-2 text-xs ${urgency.className}`}>{urgency.label}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                className="rounded-lg p-2 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))]"
                                aria-label="Edit item"
                                onClick={() => startEditItem(item)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                className="rounded-lg p-2 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--error))]"
                                aria-label="Delete item"
                                onClick={() => setPendingDelete(item.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {item.details ? (
                            <p className="mt-3 line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">{item.details}</p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
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
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">Updated {formatRelativeDate(item.updatedAt)}</span>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            {item.status !== "TODO" ? (
                              <Button
                                type="button"
                                variant="secondary"
                                className="w-full sm:w-auto"
                                loading={updatingStatusId === item.id}
                                onClick={() => void setItemStatus(item, item.status === "DONE" ? "IN_PROGRESS" : "TODO")}
                              >
                                {updatingStatusId === item.id ? "Saving..." : item.status === "DONE" ? "Reopen" : "Back"}
                              </Button>
                            ) : null}
                            {item.status !== "DONE" ? (
                              <Button
                                type="button"
                                variant="secondary"
                                className="w-full sm:w-auto"
                                loading={updatingStatusId === item.id}
                                onClick={() => void setItemStatus(item, item.status === "TODO" ? "IN_PROGRESS" : "DONE")}
                              >
                                {updatingStatusId === item.id ? "Saving..." : item.status === "TODO" ? "Start" : "Mark done"}
                              </Button>
                            ) : (
                              <span className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/30 dark:text-emerald-200 sm:w-auto">
                                <CheckCircle2 size={16} /> Completed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card title="New Item" description="Add tasks with priorities and optional due dates." className="lg:sticky lg:top-24">
            <form id="new-planner-item-form" onSubmit={addItem} className="space-y-2">
              <Input ref={newItemTitleRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Item title" required />
              <Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Details" rows={4} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Select
                  label="Priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as Item["priority"])}
                  options={[
                    { label: "High", value: "HIGH" },
                    { label: "Medium", value: "MEDIUM" },
                    { label: "Low", value: "LOW" },
                  ]}
                />
                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as Item["status"])}
                  options={[
                    { label: "To do", value: "TODO" },
                    { label: "In progress", value: "IN_PROGRESS" },
                    { label: "Done", value: "DONE" },
                  ]}
                />
              </div>
              <Input value={dueDate} onChange={(event) => setDueDate(event.target.value)} placeholder="dd-mm-yyyy" />
              <Select
                label="Category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                options={[{ label: "Unassigned", value: "" }, ...categories.map((cat) => ({ label: cat.name, value: String(cat.id) }))]}
              />
              <Button type="submit" loading={creatingItem} className="w-full sm:w-auto">
                {creatingItem ? "Saving..." : "Add item"}
              </Button>
            </form>
          </Card>

          <Card title="Categories" description="Create custom categories.">
            <form onSubmit={addCategory} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Category name" required />
              <Button type="submit" variant="secondary" loading={creatingCategory} className="w-full sm:w-auto">
                {creatingCategory ? "Saving..." : "Add"}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <Modal
        open={pendingDelete !== null}
        title="Delete planner item"
        description="This action cannot be undone."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteItem}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
      />

      <Modal
        open={editingItem !== null}
        title="Edit planner item"
        description="Update task details."
        onClose={() => setEditingItem(null)}
        onConfirm={updateItem}
        confirmLabel={savingItem ? "Saving..." : "Save changes"}
      >
        <div className="space-y-2">
          <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Item title" />
          <Textarea value={editDetails} onChange={(event) => setEditDetails(event.target.value)} placeholder="Details" rows={3} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              label="Priority"
              value={editPriority}
              onChange={(event) => setEditPriority(event.target.value as Item["priority"])}
              options={[
                { label: "High", value: "HIGH" },
                { label: "Medium", value: "MEDIUM" },
                { label: "Low", value: "LOW" },
              ]}
            />
            <Select
              label="Status"
              value={editStatus}
              onChange={(event) => setEditStatus(event.target.value as Item["status"])}
              options={[
                { label: "To do", value: "TODO" },
                { label: "In progress", value: "IN_PROGRESS" },
                { label: "Done", value: "DONE" },
              ]}
            />
          </div>
          <Input value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} placeholder="dd-mm-yyyy" />
          <Select
            label="Category"
            value={editCategoryId}
            onChange={(event) => setEditCategoryId(event.target.value)}
            options={[{ label: "Unassigned", value: "" }, ...categories.map((cat) => ({ label: cat.name, value: String(cat.id) }))]}
          />
        </div>
      </Modal>
    </div>
  );
}

