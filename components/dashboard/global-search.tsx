"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, ClipboardList, FileText, FolderOpen, Loader2, Search } from "lucide-react";

type NoteSearchItem = {
  id: number;
  title: string;
  content: string;
  subject?: string | null;
};

type FileSearchItem = {
  id: number;
  originalName: string;
  mimeType: string;
};

type PlannerSearchItem = {
  id: number;
  title: string;
  details?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate?: string | null;
};

type AssignmentSearchItem = {
  id: number;
  title: string;
  description?: string | null;
  status: "PENDING" | "COMPLETED" | "OVERDUE";
  dueDate?: string | null;
};

type ExamSearchItem = {
  id: number;
  subject: string;
  location?: string | null;
  notes?: string | null;
  date: string;
  status: "UPCOMING" | "COMPLETED";
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
};

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  section: "Notes" | "Files" | "Tasks";
  icon: typeof FileText;
  term: string;
};

const RECENT_SEARCHES_KEY = "sv-recent-searches";

function saveRecentSearch(
  term: string,
  setRecentSearches: React.Dispatch<React.SetStateAction<string[]>>,
) {
  setRecentSearches((previous) => {
    const next = [term, ...previous.filter((item) => item !== term)].slice(0, 5);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures in restricted environments.
    }
    return next;
  });
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(input?: string | null) {
  if (!input) return "";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 5) : [];
    } catch {
      return [];
    }
  });
  const [notes, setNotes] = useState<NoteSearchItem[]>([]);
  const [files, setFiles] = useState<FileSearchItem[]>([]);
  const [plannerItems, setPlannerItems] = useState<PlannerSearchItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSearchItem[]>([]);
  const [exams, setExams] = useState<ExamSearchItem[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setActiveIndex(0);
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);

    if (loaded || loading) return;

    async function loadData() {
      setLoading(true);

      const responses = await Promise.allSettled([
        fetch("/api/notes?limit=20", { cache: "no-store" }).then((res) => res.json() as Promise<ApiResponse<NoteSearchItem[]>>),
        fetch("/api/files?limit=20", { cache: "no-store" }).then((res) => res.json() as Promise<ApiResponse<FileSearchItem[]>>),
        fetch("/api/planner/items", { cache: "no-store" }).then((res) => res.json() as Promise<ApiResponse<PlannerSearchItem[]>>),
        fetch("/api/assignments", { cache: "no-store" }).then((res) => res.json() as Promise<ApiResponse<AssignmentSearchItem[]>>),
        fetch("/api/exams", { cache: "no-store" }).then((res) => res.json() as Promise<ApiResponse<ExamSearchItem[]>>),
      ]);

      const [notesPayload, filesPayload, plannerPayload, assignmentsPayload, examsPayload] = responses;

      setNotes(notesPayload.status === "fulfilled" && notesPayload.value.ok && notesPayload.value.data ? notesPayload.value.data : []);
      setFiles(filesPayload.status === "fulfilled" && filesPayload.value.ok && filesPayload.value.data ? filesPayload.value.data : []);
      setPlannerItems(
        plannerPayload.status === "fulfilled" && plannerPayload.value.ok && plannerPayload.value.data ? plannerPayload.value.data : [],
      );
      setAssignments(
        assignmentsPayload.status === "fulfilled" && assignmentsPayload.value.ok && assignmentsPayload.value.data
          ? assignmentsPayload.value.data
          : [],
      );
      setExams(examsPayload.status === "fulfilled" && examsPayload.value.ok && examsPayload.value.data ? examsPayload.value.data : []);
      setLoaded(true);
      setLoading(false);
    }

    void loadData();
  }, [loaded, loading, open]);

  const results = useMemo(() => {
    if (!debouncedQuery) return [] as SearchResult[];

    const normalized = debouncedQuery.toLowerCase();

    const noteResults = notes
      .filter((note) => [note.title, stripHtml(note.content), note.subject ?? ""].some((value) => value.toLowerCase().includes(normalized)))
      .slice(0, 5)
      .map<SearchResult>((note) => ({
        id: `note-${note.id}`,
        title: note.title,
        subtitle: note.subject ? `Note • ${note.subject}` : "Note",
        href: `/dashboard/notes?q=${encodeURIComponent(note.title)}`,
        section: "Notes",
        icon: FileText,
        term: note.title,
      }));

    const fileResults = files
      .filter((file) => [file.originalName, file.mimeType].some((value) => value.toLowerCase().includes(normalized)))
      .slice(0, 5)
      .map<SearchResult>((file) => ({
        id: `file-${file.id}`,
        title: file.originalName,
        subtitle: file.mimeType || "File",
        href: `/dashboard/my-files?q=${encodeURIComponent(file.originalName)}`,
        section: "Files",
        icon: FolderOpen,
        term: file.originalName,
      }));

    const taskResults = [
      ...plannerItems
        .filter((item) => [item.title, item.details ?? "", item.status].some((value) => value.toLowerCase().includes(normalized)))
        .slice(0, 4)
        .map<SearchResult>((item) => ({
          id: `planner-${item.id}`,
          title: item.title,
          subtitle: `Planner • ${item.status}${item.dueDate ? ` • Due ${formatDate(item.dueDate)}` : ""}`,
          href: `/dashboard/planner?q=${encodeURIComponent(item.title)}`,
          section: "Tasks",
          icon: ClipboardList,
          term: item.title,
        })),
      ...assignments
        .filter((item) => [item.title, item.description ?? "", item.status].some((value) => value.toLowerCase().includes(normalized)))
        .slice(0, 4)
        .map<SearchResult>((item) => ({
          id: `assignment-${item.id}`,
          title: item.title,
          subtitle: `Assignment • ${item.status}${item.dueDate ? ` • Due ${formatDate(item.dueDate)}` : ""}`,
          href: `/dashboard/assignments?q=${encodeURIComponent(item.title)}`,
          section: "Tasks",
          icon: ClipboardList,
          term: item.title,
        })),
      ...exams
        .filter((item) => [item.subject, item.location ?? "", item.notes ?? "", item.status].some((value) => value.toLowerCase().includes(normalized)))
        .slice(0, 3)
        .map<SearchResult>((item) => ({
          id: `exam-${item.id}`,
          title: item.subject,
          subtitle: `Exam • ${item.status} • ${formatDate(item.date)}`,
          href: `/dashboard/exams?q=${encodeURIComponent(item.subject)}`,
          section: "Tasks",
          icon: CalendarDays,
          term: item.subject,
        })),
    ].slice(0, 8);

    return [...noteResults, ...fileResults, ...taskResults];
  }, [assignments, debouncedQuery, exams, files, notes, plannerItems]);

  const groupedResults = useMemo(
    () => [
      { label: "Notes", items: results.filter((item) => item.section === "Notes") },
      { label: "Files", items: results.filter((item) => item.section === "Files") },
      { label: "Tasks", items: results.filter((item) => item.section === "Tasks") },
    ].filter((group) => group.items.length > 0),
    [results],
  );

  const keyboardOptions = debouncedQuery ? results.map((item) => item.term) : recentSearches;
  const boundedActiveIndex = keyboardOptions.length > 0 ? Math.min(activeIndex, keyboardOptions.length - 1) : 0;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (keyboardOptions.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % keyboardOptions.length);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + keyboardOptions.length) % keyboardOptions.length);
      }

      if (event.key === "Enter") {
        if (!debouncedQuery) {
          const term = recentSearches[boundedActiveIndex];
          if (term) {
            event.preventDefault();
            setActiveIndex(0);
            setQuery(term);
          }
          return;
        }

        const selected = results[boundedActiveIndex];
        if (selected) {
          event.preventDefault();
          saveRecentSearch(selected.term, setRecentSearches);
          setOpen(false);
          router.push(selected.href);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, boundedActiveIndex, debouncedQuery, keyboardOptions.length, recentSearches, results, router, open]);

  function handleResultClick(result: SearchResult) {
    saveRecentSearch(result.term, setRecentSearches);
    setOpen(false);
    router.push(result.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActiveIndex(0);
          setOpen(true);
        }}
        className="hidden h-9 w-full max-w-[360px] items-center gap-3 rounded-[var(--radius-full)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-4 text-left text-sm text-[rgb(var(--text-tertiary))] shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.55)] transition-colors hover:bg-[rgb(var(--surface-hover))] lg:inline-flex"
        aria-label="Search notes, files, and tasks"
      >
        <Search size={16} />
        <span className="flex-1">Search notes, files, tasks...</span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--text-secondary))]">
          Ctrl+K
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] bg-black/45 p-4 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true">
          <div
            className="mx-auto mt-20 w-full max-w-2xl rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-lg)] ring-1 ring-[rgb(var(--border)/0.55)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
          >
            <div className="border-b border-[rgb(var(--border))] p-4">
              <div className="flex items-center gap-3">
                <Search size={18} className="text-[rgb(var(--text-tertiary))]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setActiveIndex(0);
                    setQuery(event.target.value);
                  }}
                  placeholder="Search notes, files, and tasks..."
                  className="w-full border-0 bg-transparent px-0 py-0 text-base text-[rgb(var(--text-primary))] shadow-none outline-none placeholder:text-[rgb(var(--text-tertiary))] focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center gap-3 py-6 text-sm text-[rgb(var(--text-secondary))]">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading search index...</span>
                </div>
              ) : !debouncedQuery ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-tertiary))]">Recent searches</p>
                  {recentSearches.length > 0 ? (
                    <div className="space-y-2">
                      {recentSearches.map((term, index) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          className={`flex w-full items-center justify-between rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm ${
                            boundedActiveIndex === index
                              ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft)/0.55)] text-[rgb(var(--primary-hover))]"
                              : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] transition-colors hover:bg-[rgb(var(--surface-hover))]"
                          }`}
                        >
                          <span>{term}</span>
                          <ArrowRight size={14} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-[var(--radius-md)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-4 py-6 text-sm text-[rgb(var(--text-secondary))]">
                      Start typing to search notes, files, assignments, exams, and planner items.
                    </p>
                  )}
                </div>
              ) : groupedResults.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Nothing found for &quot;{debouncedQuery}&quot;</p>
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Try a shorter keyword or check the spelling.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedResults.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-tertiary))]">{group.label}</p>
                      <div className="space-y-2">
                        {group.items.map((item) => {
                          const globalIndex = results.findIndex((result) => result.id === item.id);
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleResultClick(item)}
                              className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-left transition ${
                                boundedActiveIndex === globalIndex
                                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft)/0.55)]"
                                  : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-colors hover:bg-[rgb(var(--surface-hover))]"
                              }`}
                            >
                              <div className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft)/0.55)] text-[rgb(var(--primary))]">
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{item.title}</p>
                                <p className="truncate text-xs text-[rgb(var(--text-secondary))]">{item.subtitle}</p>
                              </div>
                              <ArrowRight size={14} className="text-[rgb(var(--text-tertiary))]" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
