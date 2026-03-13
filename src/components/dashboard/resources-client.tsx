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

type Folder = { id: number; name: string };
type Item = { id: number; title: string; url?: string | null; notes?: string | null; tags?: string | null; folderId?: number | null };

type ApiResponse<T> = { ok: boolean; data?: T; error?: { message: string } };

export function ResourcesClient() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [folderName, setFolderName] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState("");
  const [search, setSearch] = useState("");
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
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const [foldersRes, itemsRes] = await Promise.all([fetch("/api/resources/folders"), fetch("/api/resources/items")]);
      const foldersPayload = (await foldersRes.json()) as ApiResponse<Folder[]>;
      const itemsPayload = (await itemsRes.json()) as ApiResponse<Item[]>;
      if (foldersRes.ok && foldersPayload.ok && foldersPayload.data) setFolders(foldersPayload.data);
      if (itemsRes.ok && itemsPayload.ok && itemsPayload.data) setItems(itemsPayload.data);
      setLoading(false);
    }

    void load();
  }, []);

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    }
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    }
  }

  async function deleteItem() {
    if (!pendingDelete) return;
    const response = await fetch(`/api/resources/items?id=${pendingDelete}`, { method: "DELETE" });
    if (response.ok) {
      setItems((prev) => prev.filter((item) => item.id !== pendingDelete));
      pushToast("Resource deleted", "info");
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
    }
  }

  function startEditFolder(folder: Folder) {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
  }

  async function updateFolder() {
    if (!editingFolder) return;
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
    }
  }

  const visible = useMemo(
    () => items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card title="Resources" description="Organize resources with folders, tags, and search.">
        <div className="mb-3 flex items-center gap-2">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources" />
          <Button variant="secondary" onClick={() => setSearch("")}>Clear</Button>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading resources...</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No resources yet.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => (
              <div key={item.id} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/95 p-3 shadow-[var(--shadow-xs)] transition hover:border-[rgb(var(--primary))]/25 hover:shadow-[var(--shadow-sm)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.url ? (
                      <a className="text-xs text-[var(--brand)]" href={item.url} target="_blank" rel="noreferrer">
                        {item.url}
                      </a>
                    ) : null}
                    {item.tags ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.tags.split(",").map((tag) => (
                          <Badge key={tag.trim()} variant="neutral">{tag.trim()}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => startEditItem(item)}>
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="secondary" onClick={() => setPendingDelete(item.id)}>Delete</Button>
                  </div>
                </div>
                {item.notes ? <p className="mt-2 text-xs text-[var(--muted)]">{item.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card title="New Resource" description="Add links, notes, and tags." className="lg:sticky lg:top-24">
          <form onSubmit={createItem} className="space-y-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Resource title" />
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" />
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" rows={3} />
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated)" />
            <Select
              label="Folder"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
              options={[{ label: "No folder", value: "" }, ...folders.map((folder) => ({ label: folder.name, value: String(folder.id) }))]}
            />
            <Button type="submit">Add Resource</Button>
          </form>
        </Card>

        <Card title="Folders" description="Group resources.">
          <form onSubmit={createFolder} className="flex items-center gap-2">
            <Input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Folder name" />
            <Button type="submit" variant="secondary">Add</Button>
          </form>
          <div className="mt-3 space-y-2">
            {folders.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No folders yet.</p>
            ) : (
              folders.map((folder) => (
                <div key={folder.id} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface-hover))]/80 p-2 shadow-[var(--shadow-xs)]">
                  <p className="text-sm font-medium">{folder.name}</p>
                  <Button variant="secondary" onClick={() => startEditFolder(folder)}>
                    <Pencil size={14} /> Edit
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={pendingDelete !== null}
        title="Delete resource"
        description="This action cannot be undone."
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteItem}
        danger
      />

      <Modal
        open={editingItem !== null}
        title="Edit resource"
        description="Update the details for this resource."
        onClose={() => setEditingItem(null)}
        onConfirm={updateItem}
        confirmLabel="Save changes"
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
              { label: "No folder", value: "" },
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
        confirmLabel="Save changes"
      >
        <div className="space-y-2">
          <Input value={editFolderName} onChange={(event) => setEditFolderName(event.target.value)} placeholder="Folder name" />
        </div>
      </Modal>
    </div>
  );
}
