"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, FolderOpen, Link as LinkIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast-provider";

type Folder = { id: number; name: string; createdAt?: string; updatedAt?: string };
type Item = {
  id: number;
  title: string;
  url?: string | null;
  notes?: string | null;
  tags?: string | null;
  folderId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = { ok: boolean; data?: T; error?: { message: string } };

function formatRelativeDate(input: string | undefined) {
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

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
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

function SkeletonFolders() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] animate-shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-40 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
                <div className="h-3 w-24 rounded-full bg-[rgb(var(--surface-hover))] animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResourcesClient() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [folderName, setFolderName] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editFolderId, setEditFolderId] = useState("");
  const [editFolderName, setEditFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [expanded, setExpanded] = useState<Set<number | null>>(() => new Set([null]));
  const [creatingItem, setCreatingItem] = useState(false);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(false);
  const [updatingFolder, setUpdatingFolder] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const { pushToast } = useToast();
  const newResourceTitleRef = useRef<HTMLInputElement | null>(null);


  function goToNewResourceForm() {
    document.getElementById("new-resource-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => newResourceTitleRef.current?.focus(), 250);
  }

  async function load() {
    setLoading(true);
    setHasError(false);

    try {
      const [foldersRes, itemsRes] = await Promise.all([fetch("/api/resources/folders"), fetch("/api/resources/items")]);
      const foldersPayload = (await foldersRes.json()) as ApiResponse<Folder[]>;
      const itemsPayload = (await itemsRes.json()) as ApiResponse<Item[]>;

      if (foldersRes.ok && foldersPayload.ok && foldersPayload.data) {
        setFolders(foldersPayload.data);
      }
      if (itemsRes.ok && itemsPayload.ok && itemsPayload.data) {
        setItems(itemsPayload.data);
      }

      if (!foldersRes.ok || !itemsRes.ok || !foldersPayload.ok || !itemsPayload.ok) {
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

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingFolder(true);
    const response = await fetch("/api/resources/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName }),
    });
    const payload = (await response.json()) as ApiResponse<Folder>;
    if (response.ok && payload.ok && payload.data) {
      setFolders((prev) => [...prev, payload.data!]);
      setFolderName("");
      pushToast("Folder added", "success");
      setExpanded((prev) => new Set(prev).add(payload.data!.id));
    } else {
      pushToast(payload.error?.message ?? "Unable to add folder", "error");
    }
    setCreatingFolder(false);
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingItem(true);
    const response = await fetch("/api/resources/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, notes, tags, folderId: folderId ? Number(folderId) : null }),
    });
    const payload = (await response.json()) as ApiResponse<Item>;
    if (response.ok && payload.ok && payload.data) {
      setItems((prev) => [payload.data!, ...prev]);
      setTitle("");
      setUrl("");
      setNotes("");
      setTags("");
      pushToast("Resource added", "success");
      setExpanded((prev) => new Set(prev).add(payload.data!.folderId ?? null));
    } else {
      pushToast(payload.error?.message ?? "Unable to add resource", "error");
    }
    setCreatingItem(false);
  }

  async function deleteItem() {
    if (!pendingDelete) return;
    setDeletingItem(true);
    try {
      const response = await fetch(`/api/resources/items?id=${pendingDelete}`, { method: "DELETE" });
      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== pendingDelete));
        pushToast("Resource deleted", "success");
      } else {
        pushToast("Unable to delete resource", "error");
      }
    } finally {
      setDeletingItem(false);
    }
    setPendingDelete(null);
  }

  function startEditItem(item: Item) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditUrl(item.url ?? "");
    setEditNotes(item.notes ?? "");
    setEditTags(item.tags ?? "");
    setEditFolderId(item.folderId ? String(item.folderId) : "");
  }

  async function updateItem() {
    if (!editingItem) return;
    setUpdatingItem(true);
    const response = await fetch("/api/resources/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingItem.id,
        title: editTitle,
        url: editUrl || undefined,
        notes: editNotes || undefined,
        tags: editTags || undefined,
        folderId: editFolderId ? Number(editFolderId) : null,
      }),
    });
    const payload = (await response.json()) as ApiResponse<Item>;
    if (response.ok && payload.ok && payload.data) {
      setItems((prev) => prev.map((entry) => (entry.id === editingItem.id ? payload.data! : entry)));
      setEditingItem(null);
      pushToast("Resource updated", "success");
    } else {
      pushToast(payload.error?.message ?? "Unable to update resource", "error");
    }
    setUpdatingItem(false);
  }

  function startEditFolder(folder: Folder) {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
  }

  async function updateFolder() {
    if (!editingFolder) return;
    setUpdatingFolder(true);
    const response = await fetch("/api/resources/folders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingFolder.id, name: editFolderName }),
    });
    const payload = (await response.json()) as ApiResponse<Folder>;
    if (response.ok && payload.ok && payload.data) {
      setFolders((prev) => prev.map((folder) => (folder.id === editingFolder.id ? payload.data! : folder)));
      setEditingFolder(null);
      pushToast("Folder updated", "success");
    } else {
      pushToast(payload.error?.message ?? "Unable to update folder", "error");
    }
    setUpdatingFolder(false);
  }

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (!search.trim()) return true;
        const normalized = search.toLowerCase();
        return [item.title, item.url ?? "", item.notes ?? "", item.tags ?? ""].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      }),
    [items, search],
  );

  const itemsByFolder = useMemo(() => {
    const map = new Map<number | null, Item[]>();
    map.set(null, []);
    folders.forEach((folder) => map.set(folder.id, []));
    visible.forEach((item) => {
      const key = item.folderId ?? null;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    return map;
  }, [folders, visible]);

  const folderCards = useMemo(() => {
    const base = [{ id: null as number | null, name: "Unsorted" }, ...folders];
    return base.map((folder) => ({
      id: folder.id,
      name: folder.name,
      count: (itemsByFolder.get(folder.id) ?? []).length,
    }));
  }, [folders, itemsByFolder]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Your workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Resources</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Save links and quick references, grouped into folders.</p>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={goToNewResourceForm}
        >
          <Plus size={16} /> Add resource
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {hasError ? (
        <ErrorCard onRetry={() => void load()} />
      ) : loading ? (
        <SkeletonFolders />
      ) : items.length === 0 && folders.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 text-center shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
            <FolderOpen size={26} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">No resources yet</h3>
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Add your first link or study reference so it&apos;s always one click away.</p>
          <div className="mt-4">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={goToNewResourceForm}
            >
              Add a resource
            </Button>
          </div>
        </div>
      ) : (
        <>
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full max-w-lg">
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources by title, URL, or notes" />
                </div>
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setSearch("")} disabled={!search.trim()}>
                  Clear
                </Button>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {folderCards.map((folder) => {
                const open = expanded.has(folder.id);
                return (
                  <button
                    key={folder.id ?? "unsorted"}
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(folder.id)) next.delete(folder.id);
                        else next.add(folder.id);
                        return next;
                      })
                    }
                    className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 text-left shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
                          <FolderOpen size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{folder.name}</p>
                          <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">{folder.count} resources</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[rgb(var(--text-tertiary))]">{open ? "Hide" : "View"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {folderCards
                .filter((folder) => expanded.has(folder.id))
                .map((folder) => {
                  const folderItems = itemsByFolder.get(folder.id) ?? [];
                  return (
                    <Card key={folder.id ?? "unsorted-items"} title={folder.name} description="Saved resources in this folder.">
                      {folderItems.length === 0 ? (
                        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 text-center shadow-[var(--shadow-sm)]">
                          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">No resources in this folder</p>
                          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Add a link or reference and it will appear here.</p>
                          <div className="mt-3">
                            <Button
                              type="button"
                              className="w-full sm:w-auto"
                              onClick={goToNewResourceForm}
                            >
                              Add resource
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {folderItems.map((item) => (
                            <div
                              key={item.id}
                              className="group rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{item.title}</p>
                                  {item.url ? (
                                    <a
                                      className="mt-1 inline-flex items-center gap-1 truncate text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
                                      href={item.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      title={item.url}
                                    >
                                      <LinkIcon size={12} />
                                      <span className="truncate">{item.url}</span>
                                    </a>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                  <button
                                    type="button"
                                    className="rounded-lg p-2 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))]"
                                    aria-label="Edit resource"
                                    onClick={() => startEditItem(item)}
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-lg p-2 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--error))]"
                                    aria-label="Delete resource"
                                    onClick={() => setPendingDelete(item.id)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              {item.tags ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {item.tags
                                    .split(",")
                                    .map((tag) => tag.trim())
                                    .filter(Boolean)
                                    .slice(0, 4)
                                    .map((tag) => (
                                      <Badge key={tag} variant="neutral">
                                        {tag}
                                      </Badge>
                                    ))}
                                </div>
                              ) : null}

                              {item.notes ? (
                                <p className="mt-3 line-clamp-3 text-sm text-[rgb(var(--text-secondary))]">{item.notes}</p>
                              ) : null}

                              <div className="mt-4 text-xs text-[rgb(var(--text-tertiary))]">Added {formatRelativeDate(item.createdAt)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
            </div>
        </>
          )}
        </div>

        <div className="space-y-4">
            <Card title="New Resource" description="Add links, notes, and tags." className="lg:sticky lg:top-24">
              <form id="new-resource-form" onSubmit={createItem} className="space-y-2">
                <Input ref={newResourceTitleRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Resource title" required />
                <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" />
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" rows={3} />
                <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated)" />
                <Select
                  label="Folder"
                  value={folderId}
                  onChange={(event) => setFolderId(event.target.value)}
                  options={[{ label: "Unsorted", value: "" }, ...folders.map((folder) => ({ label: folder.name, value: String(folder.id) }))]}
                />
                <Button type="submit" loading={creatingItem} className="w-full sm:w-auto">
                  {creatingItem ? "Adding..." : "Add Resource"}
                </Button>
              </form>
            </Card>

            <Card title="Folders" description="Group resources.">
              <form onSubmit={createFolder} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Folder name" required />
                <Button type="submit" variant="secondary" loading={creatingFolder} className="w-full sm:w-auto">
                  {creatingFolder ? "Adding..." : "Add folder"}
                </Button>
              </form>
              <div className="mt-3 space-y-2">
                {folders.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--text-secondary))]">No folders yet.</p>
                ) : (
                  folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
                    >
                      <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{folder.name}</p>
                      <Button type="button" variant="secondary" onClick={() => startEditFolder(folder)}>
                        <Pencil size={14} /> Edit
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
      </div>

      <Modal
        open={pendingDelete !== null}
        title="Delete resource"
        description="This action cannot be undone."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteItem}
        confirmLabel={deletingItem ? "Deleting..." : "Delete"}
        danger
      />

      <Modal
        open={editingItem !== null}
        title="Edit resource"
        description="Update the details for this resource."
        onClose={() => setEditingItem(null)}
        onConfirm={updateItem}
        confirmLabel={updatingItem ? "Saving..." : "Save changes"}
      >
        <div className="space-y-2">
          <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Title" />
          <Input value={editUrl} onChange={(event) => setEditUrl(event.target.value)} placeholder="URL" />
          <Textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} placeholder="Notes" rows={3} />
          <Input value={editTags} onChange={(event) => setEditTags(event.target.value)} placeholder="Tags (comma separated)" />
          <Select
            label="Folder"
            value={editFolderId}
            onChange={(event) => setEditFolderId(event.target.value)}
            options={[
              { label: "Unsorted", value: "" },
              ...folders.map((folder) => ({ label: folder.name, value: String(folder.id) })),
            ]}
          />
        </div>
      </Modal>

      <Modal
        open={editingFolder !== null}
        title="Edit folder"
        description="Rename your folder."
        onClose={() => setEditingFolder(null)}
        onConfirm={updateFolder}
        confirmLabel={updatingFolder ? "Saving..." : "Save changes"}
      >
        <div className="space-y-2">
          <Input value={editFolderName} onChange={(event) => setEditFolderName(event.target.value)} placeholder="Folder name" />
        </div>
      </Modal>
    </div>
  );
}
