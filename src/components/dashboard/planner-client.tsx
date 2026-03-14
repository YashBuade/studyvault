"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Tabs } from "@/src/components/ui/tabs";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast-provider";

type Category = {
  id: number;
  name: string;
  color: string;
};

type Item = {
  id: number;
  title: string;
  details?: string | null;
  dueDate?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  order: number;
  categoryId?: number | null;
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

export function PlannerClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<"board" | "calendar">("board");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<Item["priority"]>("MEDIUM");
  const [status, setStatus] = useState<Item["status"]>("TODO");
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editPriority, setEditPriority] = useState<Item["priority"]>("MEDIUM");
  const [editStatus, setEditStatus] = useState<Item["status"]>("TODO");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("");
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const [catRes, itemRes] = await Promise.all([fetch("/api/planner/categories"), fetch("/api/planner/items")]);
      const catPayload = (await catRes.json()) as ApiResponse<Category[]>;
      const itemPayload = (await itemRes.json()) as ApiResponse<Item[]>;
      setCategories(catPayload.data ?? []);
      setItems(itemPayload.data ?? []);
    }

    void load();
  }, []);

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/planner/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    const payload = (await response.json()) as ApiResponse<Category>;
    if (!response.ok || !payload.ok || !payload.data) {
      setError(payload.error?.message ?? "Could not create category.");
      return;
    }
    setCategories((prev) => [...prev, payload.data!]);
    setNewCategory("");
    pushToast("Category added", "success");
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const isoDate = toIsoDate(dueDate);
    if (dueDate && !isoDate) {
      setError("Use date format dd-mm-yyyy.");
      return;
    }
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
      setError(payload.error?.message ?? "Could not add item.");
      return;
    }
    setItems((prev) => [...prev, payload.data!]);
    setTitle("");
    setDetails("");
    setDueDate("");
    setCategoryId("");
    pushToast("Planner item created", "success");
  }

  async function deleteItem() {
    if (!pendingDelete) return;
    const response = await fetch(`/api/planner/items?id=${pendingDelete}`, { method: "DELETE" });
    if (response.ok) {
      setItems((prev) => prev.filter((item) => item.id !== pendingDelete));
      pushToast("Planner item deleted", "info");
    }
    setPendingDelete(null);
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
    const isoDate = toIsoDate(editDueDate);
    if (editDueDate && !isoDate) {
      setError("Use date format dd-mm-yyyy.");
      return;
    }
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
      setError(payload.error?.message ?? "Could not update item.");
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === editingItem.id ? payload.data! : item)));
    setEditingItem(null);
    pushToast("Planner item updated", "success");
  }

  function startEditCategory(category: Category) {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color);
  }

  async function updateCategory() {
    if (!editingCategory) return;
    const response = await fetch("/api/planner/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingCategory.id, name: editCategoryName, color: editCategoryColor }),
    });
    const payload = (await response.json()) as ApiResponse<Category>;
    if (!response.ok || !payload.ok || !payload.data) {
      setError(payload.error?.message ?? "Could not update category.");
      return;
    }
    setCategories((prev) => prev.map((cat) => (cat.id === editingCategory.id ? payload.data! : cat)));
    setEditingCategory(null);
    pushToast("Category updated", "success");
  }

  async function handleDrop(itemId: number, targetCategoryId: number | null) {
    const updated = items.map((item, index) => ({
      ...item,
      order: index,
      categoryId: item.id === itemId ? targetCategoryId : item.categoryId ?? null,
    }));

    setItems(updated);
    await fetch("/api/planner/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated.map((item) => ({ id: item.id, order: item.order, categoryId: item.categoryId })) ),
    });
  }

  const grouped = useMemo(() => {
    const map = new Map<number | null, Item[]>();
    map.set(null, []);
    categories.forEach((cat) => map.set(cat.id, []));
    items.forEach((item) => {
      const key = item.categoryId ?? null;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    return map;
  }, [categories, items]);

  const plannerStats = useMemo(() => {
    const todo = items.filter((item) => item.status === "TODO").length;
    const inProgress = items.filter((item) => item.status === "IN_PROGRESS").length;
    const done = items.filter((item) => item.status === "DONE").length;
    const total = items.length;
    const completion = total > 0 ? Math.round((done / total) * 100) : 0;
    return { todo, inProgress, done, total, completion };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,rgb(var(--color-info-light))_0%,rgb(var(--surface))_100%)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Focus Queue</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{plannerStats.todo}</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">Tasks waiting to start</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,rgb(var(--color-primary-light))_0%,rgb(var(--surface))_100%)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">In Motion</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{plannerStats.inProgress}</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">Currently active tasks</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,rgb(var(--color-success-light))_0%,rgb(var(--surface))_100%)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-tertiary))]">Completion</p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{plannerStats.completion}%</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">{plannerStats.done} completed tasks</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card title="Planner" description="Drag and drop tasks between categories, add due dates, and priorities.">
        <Tabs
          tabs={[
            { id: "board", label: "Board" },
            { id: "calendar", label: "Calendar" },
          ]}
          value={view}
          onChange={(value) => setView(value as "board" | "calendar")}
        />

        {view === "board" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[{ id: null, name: "Unassigned", color: "var(--muted)" }, ...categories].map((cat) => (
              <div
                key={cat.id ?? "unassigned"}
                className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/92 p-3 shadow-[var(--shadow-xs)]"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const itemId = Number(event.dataTransfer.getData("text/plain"));
                  if (!Number.isNaN(itemId)) {
                    void handleDrop(itemId, cat.id ?? null);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: cat.color }}>{cat.name}</p>
                  {cat.id ? (
                    <button
                      type="button"
                      onClick={() => startEditCategory(cat)}
                      className="rounded-lg p-1 text-[var(--muted)] hover:text-[var(--brand)]"
                      aria-label="Edit category"
                    >
                      <Pencil size={14} />
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 space-y-2">
                  {(grouped.get(cat.id ?? null) ?? []).map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", String(item.id))}
                      className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))] p-3 shadow-[var(--shadow-xs)] transition hover:border-[rgb(var(--primary))]/25 hover:shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs text-[var(--muted)]">{item.priority} - {item.status}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--muted)]">
                          <GripVertical size={14} />
                          <button onClick={() => startEditItem(item)} className="rounded-lg p-1 hover:text-[var(--brand)]" aria-label="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setPendingDelete(item.id)} className="rounded-lg p-1 hover:text-red-500" aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {item.dueDate ? <p className="mt-2 text-xs text-[var(--muted)]">Due {new Date(item.dueDate).toLocaleDateString()}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]/60 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
                  <CalendarDays size={24} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">Nothing planned yet</h3>
                <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">Add your first task so your week starts to take shape.</p>
              </div>
            ) : (
              items
                .filter((item) => item.dueDate)
                .map((item) => (
                  <div key={item.id} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))] p-3 shadow-[var(--shadow-xs)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-[var(--muted)]">Due {new Date(item.dueDate ?? "").toLocaleDateString()}</p>
                      </div>
                      <Button variant="secondary" onClick={() => startEditItem(item)}>
                        <Pencil size={14} /> Edit
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card title="New Item" description="Add tasks with priorities and optional due dates." className="lg:sticky lg:top-24">
          <form onSubmit={addItem} className="space-y-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Item title" />
            <Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Details" rows={4} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                label="Priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Item["priority"])}
                options={[
                  { label: "Low", value: "LOW" },
                  { label: "Medium", value: "MEDIUM" },
                  { label: "High", value: "HIGH" },
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
            {error ? <Alert variant="error" message={error} /> : null}
            <Button type="submit">
              <Plus size={14} /> Add Item
            </Button>
          </form>
        </Card>

        <Card title="Categories" description="Create custom categories.">
          <form onSubmit={addCategory} className="flex items-center gap-2">
            <Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Category name" />
            <Button type="submit" variant="secondary">Add</Button>
          </form>
        </Card>

        <Card title="Planner Challenge" description="Daily micro-goal to keep momentum.">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Complete one high-priority task before adding a new one today.
          </p>
        </Card>
      </div>

      <Modal
        open={pendingDelete !== null}
        title="Delete planner item"
        description="This will permanently remove the planner item."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteItem}
        danger
      />

      <Modal
        open={editingItem !== null}
        title="Edit planner item"
        description="Update task details."
        onClose={() => setEditingItem(null)}
        onConfirm={updateItem}
        confirmLabel="Save changes"
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
                { label: "Low", value: "LOW" },
                { label: "Medium", value: "MEDIUM" },
                { label: "High", value: "HIGH" },
              ]}
            />
            <Select
              label="Status"
              value={editStatus}
              onChange={(event) => setEditStatus(event.target.value as Item["status"])}
              options={[
                { label: "Todo", value: "TODO" },
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
            options={[
              { label: "Unassigned", value: "" },
              ...categories.map((cat) => ({ label: cat.name, value: String(cat.id) })),
            ]}
          />
        </div>
      </Modal>

      <Modal
        open={editingCategory !== null}
        title="Edit category"
        description="Rename and adjust the category color."
        onClose={() => setEditingCategory(null)}
        onConfirm={updateCategory}
        confirmLabel="Save changes"
      >
        <div className="space-y-2">
          <Input value={editCategoryName} onChange={(event) => setEditCategoryName(event.target.value)} placeholder="Category name" />
          <Input value={editCategoryColor} onChange={(event) => setEditCategoryColor(event.target.value)} placeholder="Color (hex or CSS var)" />
        </div>
      </Modal>
      </div>
    </div>
  );
}
