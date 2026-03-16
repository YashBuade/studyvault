"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Download,
  Info,
  FileUp,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Menu,
  Plus,
  Search,
  Settings2,
  ChevronDown,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { useToast } from "@/src/components/ui/toast-provider";

type PublicNote = {
  id: number;
  title: string;
  content: string;
  slug: string;
  subject?: string | null;
  semester?: string | null;
  tags?: string | null;
  createdAt: string;
  user: {
    name: string;
    role: "USER" | "ADMIN" | "TEACHER";
    teacherVerificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  };
  noteVerificationStatus?: "VERIFIED" | "UNVERIFIED";
  attachments?: { file: { id: number; originalName: string; verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" } }[];
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string };
  meta?: { hasMore?: boolean; nextCursor?: number | null };
};

type PublicFile = {
  id: number;
  originalName: string;
  size: number;
  createdAt: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt?: string | null;
  verifiedBy?: { id: number; name: string } | null;
  user: {
    id: number;
    name: string;
    role: "USER" | "ADMIN" | "TEACHER";
    teacherVerificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  };
};

const STUDENT_CATEGORIES = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Business",
  "English",
  "History",
  "Engineering",
] as const;
const LIBRARY_PREFS_KEY = "studyvault-public-library-prefs-v1";

type LibraryPrefs = {
  categories: string[];
  semesters: string[];
  tags: string[];
};

const CLIENT_UPLOAD_MAX_MB = Number(process.env.NEXT_PUBLIC_FILE_UPLOAD_MAX_MB ?? 20);
const CLIENT_UPLOAD_MAX_BYTES = Math.max(1, Math.min(CLIENT_UPLOAD_MAX_MB, 100)) * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferFileKind(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) return "Image";
  if (["pdf"].includes(extension)) return "PDF";
  if (["doc", "docx"].includes(extension)) return "Document";
  if (["ppt", "pptx"].includes(extension)) return "Slides";
  if (["xls", "xlsx", "csv"].includes(extension)) return "Sheet";
  return "File";
}

function toInputDateValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeListItem(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isVerifiedTeacher(user: { role: "USER" | "ADMIN" | "TEACHER"; teacherVerificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED" }) {
  return user.role === "TEACHER" && user.teacherVerificationStatus === "APPROVED";
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export function PublicNotesClient() {
  const [navOpen, setNavOpen] = useState(false);
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState<PublicFile[]>([]);
  const [filesCursor, setFilesCursor] = useState<number | null>(null);
  const [filesHasMore, setFilesHasMore] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesSearch, setFilesSearch] = useState("");
  const [fileKindFilter, setFileKindFilter] = useState("All");
  const [noteView, setNoteView] = useState<"grid" | "list">("grid");
  const [teacherOnly, setTeacherOnly] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newSemester, setNewSemester] = useState(toInputDateValue(new Date()));
  const [newTags, setNewTags] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customSemesters, setCustomSemesters] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [semesterDraft, setSemesterDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [libraryMode] = useState<"browse" | "share" | "all">("browse");
  const hydratedPrefs = useRef(false);

  const { pushToast } = useToast();
  const notesLoadingRef = useRef(false);
  const filesLoadingRef = useRef(false);

  const subjects = useMemo(() => {
    const set = new Set<string>([...STUDENT_CATEGORIES, ...customCategories]);
    notes.forEach((note) => {
      if (note.subject?.trim()) set.add(note.subject.trim());
    });
    return Array.from(set);
  }, [notes, customCategories]);

  const semesters = useMemo(() => {
    const set = new Set<string>(customSemesters);
    notes.forEach((note) => {
      if (note.semester?.trim()) set.add(note.semester.trim());
    });
    return Array.from(set);
  }, [notes, customSemesters]);

  const sortedNotes = useMemo(() => {
    const copy = [...notes];
    copy.sort((a, b) =>
      sort === "latest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return copy;
  }, [notes, sort]);

  const visibleNotes = useMemo(
    () => sortedNotes.filter((note) => (teacherOnly ? isVerifiedTeacher(note.user) : true)),
    [sortedNotes, teacherOnly],
  );

  const hasActiveFilters = useMemo(
    () => Boolean(search.trim() || subject || semester || tag || sort !== "latest" || teacherOnly),
    [search, subject, semester, sort, tag, teacherOnly],
  );

  const topTags = useMemo(() => {
    const counter = new Map<string, number>();
    notes.forEach((note) => {
      note.tags
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => counter.set(item, (counter.get(item) ?? 0) + 1));
    });
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [notes]);

  const recentNotesCount = useMemo(() => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return notes.filter((item) => new Date(item.createdAt).getTime() >= threeDaysAgo).length;
  }, [notes]);

  const weekNotesCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return notes.filter((item) => new Date(item.createdAt).getTime() >= weekAgo).length;
  }, [notes]);
  const verifiedNotesCount = useMemo(
    () => notes.filter((item) => item.noteVerificationStatus === "VERIFIED").length,
    [notes],
  );

  const overviewAllZero = notes.length === 0 && files.length === 0 && weekNotesCount === 0 && subjects.length === 0;

  const availableFileKinds = useMemo(() => {
    const kinds = new Set<string>();
    files.forEach((file) => kinds.add(inferFileKind(file.originalName)));
    return ["All", ...Array.from(kinds)];
  }, [files]);

  const visibleFiles = useMemo(() => {
    return files.filter((file) => {
      const kindMatches = fileKindFilter === "All" || inferFileKind(file.originalName) === fileKindFilter;
      const teacherMatches = teacherOnly ? isVerifiedTeacher(file.user) : true;
      return kindMatches && teacherMatches;
    });
  }, [files, fileKindFilter, teacherOnly]);

  const loadNotes = useCallback(
    async (options: { reset?: boolean; cursor: number | null }) => {
      if (notesLoadingRef.current) return;
      notesLoadingRef.current = true;
      setLoading(true);

      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (subject) params.set("subject", subject);
      if (semester) params.set("semester", semester);
      if (tag) params.set("tag", tag);
      if (!options.reset && options.cursor) params.set("cursor", String(options.cursor));
      params.set("limit", "12");

      const response = await fetch(`/api/notes/public?${params.toString()}`);
      const payload = await parseApiResponse<PublicNote[]>(response);

      if (response.ok && payload?.ok && payload.data) {
        setNotes((prev) => (options.reset ? payload.data! : [...prev, ...payload.data!]));
        setHasMore(Boolean(payload.meta?.hasMore));
        setCursor(payload.meta?.nextCursor ?? null);
      } else {
        pushToast(payload?.error?.message ?? "Unable to load public notes", "error");
      }

      setLoading(false);
      notesLoadingRef.current = false;
    },
    [pushToast, search, subject, semester, tag],
  );

  const loadFiles = useCallback(
    async (options: { reset?: boolean; cursor: number | null }) => {
      if (filesLoadingRef.current) return;
      filesLoadingRef.current = true;
      setFilesLoading(true);

      const params = new URLSearchParams();
      if (filesSearch.trim()) params.set("q", filesSearch.trim());
      if (!options.reset && options.cursor) params.set("cursor", String(options.cursor));
      params.set("limit", "9");

      const response = await fetch(`/api/files/public?${params.toString()}`);
      const payload = await parseApiResponse<PublicFile[]>(response);
      if (response.ok && payload?.ok && payload.data) {
        setFiles((prev) => (options.reset ? payload.data! : [...prev, ...payload.data!]));
        setFilesHasMore(Boolean(payload.meta?.hasMore));
        setFilesCursor(payload.meta?.nextCursor ?? null);
      } else {
        pushToast(payload?.error?.message ?? "Unable to load public files", "error");
      }

      setFilesLoading(false);
      filesLoadingRef.current = false;
    },
    [pushToast, filesSearch],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LIBRARY_PREFS_KEY);
      if (!raw) {
        hydratedPrefs.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as Partial<LibraryPrefs>;
      setCustomCategories(Array.isArray(parsed.categories) ? parsed.categories.map(normalizeListItem).filter(Boolean) : []);
      setCustomSemesters(Array.isArray(parsed.semesters) ? parsed.semesters.map(normalizeListItem).filter(Boolean) : []);
      setCustomTags(Array.isArray(parsed.tags) ? parsed.tags.map(normalizeListItem).filter(Boolean) : []);
    } catch {
      // ignore malformed local data
    } finally {
      hydratedPrefs.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydratedPrefs.current || typeof window === "undefined") return;
    const payload: LibraryPrefs = {
      categories: customCategories,
      semesters: customSemesters,
      tags: customTags,
    };
    window.localStorage.setItem(LIBRARY_PREFS_KEY, JSON.stringify(payload));
  }, [customCategories, customSemesters, customTags]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotes({ reset: true, cursor: null });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [loadNotes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFiles({ reset: true, cursor: null });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [loadFiles]);

  async function createPublicNote() {
    if (!title.trim() || !description.trim()) {
      pushToast("Title and description are required.", "error");
      return;
    }

    if (uploadFiles.length === 0) {
      pushToast("At least one file is required to publish a public note.", "error");
      return;
    }

    const oversized = uploadFiles.find((file) => file.size > CLIENT_UPLOAD_MAX_BYTES);
    if (oversized) {
      pushToast(
        `${oversized.name} exceeds the ${Math.round(CLIENT_UPLOAD_MAX_BYTES / (1024 * 1024))}MB upload limit.`,
        "error",
      );
      return;
    }

    setCreating(true);
    const attachmentIds: number[] = [];

    for (const file of uploadFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isPublic", "true");

      const uploadRes = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const uploadPayload = await parseApiResponse<{ id: number }>(uploadRes);

      if (uploadRes.status === 401) {
        pushToast("Please sign in to upload public study content.", "error");
        setCreating(false);
        return;
      }

      if (!uploadRes.ok || !uploadPayload?.ok || !uploadPayload.data?.id) {
        const fallback =
          uploadRes.status === 413
            ? "Upload payload too large for deployment function. Use a smaller file."
            : uploadRes.status >= 500
              ? `Upload service failed (${uploadRes.status}).`
              : "Unable to upload one of the files.";
        pushToast(uploadPayload?.error?.message ?? fallback, "error");
        setCreating(false);
        return;
      }

      attachmentIds.push(uploadPayload.data.id);
    }

    const createRes = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        content: description.trim(),
        subject: newSubject || undefined,
        semester: newSemester || undefined,
        tags: newTags || undefined,
        isPublic: true,
        attachmentIds,
      }),
    });

    const createPayload = await parseApiResponse<PublicNote>(createRes);

    if (createRes.status === 401) {
      pushToast("Please sign in to publish public study content.", "error");
      setCreating(false);
      return;
    }

    if (!createRes.ok || !createPayload?.ok || !createPayload.data) {
      pushToast(createPayload?.error?.message ?? "Could not publish your note.", "error");
      setCreating(false);
      return;
    }

    setTitle("");
    setDescription("");
    setNewSubject("");
    setNewTags("");
    setUploadFiles([]);
    if (newSubject.trim()) {
      const normalized = normalizeListItem(newSubject);
      setCustomCategories((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    }
    if (newSemester.trim()) {
      const normalized = normalizeListItem(newSemester);
      setCustomSemesters((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    }
    if (newTags.trim()) {
      const newTagItems = newTags.split(",").map(normalizeListItem).filter(Boolean);
      if (newTagItems.length) {
        setCustomTags((prev) => {
          const merged = new Set(prev);
          newTagItems.forEach((item) => merged.add(item));
          return Array.from(merged);
        });
      }
    }
    pushToast("Public note published successfully.", "success");
    setCreating(false);
    void loadNotes({ reset: true, cursor: null });
    void loadFiles({ reset: true, cursor: null });
  }

  return (
    <div>
      <header className="sticky top-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.95)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <Logo size="sm" />

          <nav className="hidden items-center gap-7 lg:flex">
            <Link
              href="#browse"
              className="text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] dark:text-slate-300 dark:hover:text-slate-100"
            >
              Browse All
            </Link>
            <Link
              href="/notes"
              className="text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] dark:text-slate-300 dark:hover:text-slate-100"
            >
              Public Notes
            </Link>
            <Link
              href="/auth/teacher/login"
              className="text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] dark:text-slate-300 dark:hover:text-slate-100"
            >
              For Teachers
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link href="/auth/login" className="btn btn-secondary btn-sm">
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn btn-primary btn-sm min-h-9">
              Get started
            </Link>
          </div>

          <button
            type="button"
            aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setNavOpen((value) => !value)}
            className="icon-button md:hidden"
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {navOpen ? (
          <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))] dark:border-slate-700 dark:bg-slate-900 md:hidden">
            <div className="page-shell flex flex-col gap-3 py-4">
              <Link
                href="#browse"
                onClick={() => setNavOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-text-primary))] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                Browse All
              </Link>
              <Link
                href="/notes"
                onClick={() => setNavOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-text-primary))] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                Public Notes
              </Link>
              <Link
                href="/auth/teacher/login"
                onClick={() => setNavOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-text-primary))] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                For Teachers
              </Link>
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--color-bg))] px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <span className="text-sm font-medium text-[rgb(var(--color-text-secondary))] dark:text-slate-300">Theme</span>
                <ThemeToggle />
              </div>
              <Link href="/auth/login" onClick={() => setNavOpen(false)} className="btn btn-secondary w-full">
                Sign in
              </Link>
              <Link href="/auth/signup" onClick={() => setNavOpen(false)} className="btn btn-primary w-full">
                Get started
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-gradient-to-br from-[rgb(var(--surface))] via-[rgb(var(--surface-hover))] to-[rgb(var(--surface))] p-6 shadow-[var(--shadow-lg)] dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-700">
        <div className="hero-grid absolute inset-0 opacity-35" />
        <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[rgb(var(--color-success))]/12 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[rgb(var(--color-info))]/12 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-1 lg:items-center">
          <div>
            <div className="section-kicker">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Free · Open · Student-built
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[rgb(var(--text-primary))] dark:text-slate-100 sm:text-4xl">
              Public Notes Library
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[rgb(var(--text-secondary))] dark:text-slate-300 sm:text-base">
              Browse notes, summaries, and study files shared by students and verified teachers. No account needed to read — sign up to contribute.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/75 bg-[rgb(var(--surface))]/88 p-4 shadow-[var(--shadow-sm)] dark:border-slate-700 dark:bg-slate-800/88 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))] dark:text-slate-400">Recent activity</p>
                <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">{recentNotesCount === 0 ? "—" : recentNotesCount}</p>
                <p
                  className={`mt-1 text-xs dark:text-slate-300 ${recentNotesCount === 0 ? "text-[rgb(var(--text-tertiary))] dark:text-slate-400" : "text-[rgb(var(--text-secondary))]"}`}
                >
                  notes added in the last 3 days
                </p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/75 bg-[rgb(var(--surface))]/88 p-4 shadow-[var(--shadow-sm)] dark:border-slate-700 dark:bg-slate-800/88 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))] dark:text-slate-400">Verified notes</p>
                <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">{verifiedNotesCount === 0 ? "—" : verifiedNotesCount}</p>
                <p
                  className={`mt-1 text-xs dark:text-slate-300 ${verifiedNotesCount === 0 ? "text-[rgb(var(--text-tertiary))] dark:text-slate-400" : "text-[rgb(var(--text-secondary))]"}`}
                >
                  already reviewed and surfaced clearly
                </p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/75 bg-[rgb(var(--surface))]/88 p-4 shadow-[var(--shadow-sm)] dark:border-slate-700 dark:bg-slate-800/88 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))] dark:text-slate-400">Topic spread</p>
                <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">{subjects.length === 0 ? "—" : subjects.length}</p>
                <p
                  className={`mt-1 text-xs dark:text-slate-300 ${subjects.length === 0 ? "text-[rgb(var(--text-tertiary))] dark:text-slate-400" : "text-[rgb(var(--text-secondary))]"}`}
                >
                  active subject paths to explore
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {overviewAllZero ? (
        <Card className="border-[rgb(var(--border))] bg-[rgb(var(--surface))] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-700">
          <div className="py-8 text-center">
            <p className="text-base font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">
              The library is brand new — be the first to publish a note.
            </p>
            <Link href="/auth/signup" className="btn btn-primary mt-4 inline-flex">
              Publish your first note
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] via-[rgb(var(--surface-hover))] to-[rgb(var(--background-alt))] dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-700">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="section-kicker">Library overview</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xl font-bold text-[rgb(var(--text-primary))] dark:text-slate-100">{notes.length}</p>
                <p className="text-xs text-[rgb(var(--text-secondary))] dark:text-slate-300">Published Notes</p>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xl font-bold text-[rgb(var(--text-primary))] dark:text-slate-100">{files.length}</p>
                <p className="text-xs text-[rgb(var(--text-secondary))] dark:text-slate-300">Attached Files</p>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xl font-bold text-[rgb(var(--text-primary))] dark:text-slate-100">{weekNotesCount}</p>
                <p className="text-xs text-[rgb(var(--text-secondary))] dark:text-slate-300">Added This Week</p>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xl font-bold text-[rgb(var(--text-primary))] dark:text-slate-100">{subjects.length}</p>
                <p className="text-xs text-[rgb(var(--text-secondary))] dark:text-slate-300">Subjects Covered</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-6 py-4 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">
          Want to share your notes with other students?
        </p>
        <Link href="/auth/signup" className="btn btn-primary btn-sm">
          Create free account →
        </Link>
      </div>

      {libraryMode !== "browse" ? (
      <Card title="Upload to Public Library" description="Share your notes, images, and documents with student-friendly categorization.">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title (e.g., OOP Unit-3 quick revision)" />
            <Select
              label="Category"
              value={newSubject}
              onChange={(event) => setNewSubject(event.target.value)}
              options={[{ label: "Select category", value: "" }, ...subjects.map((item) => ({ label: item, value: item }))]}
            />
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="w-full rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] shadow-[var(--shadow-xs)] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:border-[rgb(var(--border-focus))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:shadow-none dark:ring-1 dark:ring-slate-700"
            placeholder="Description / note content (key concepts, formulas, important points)."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={newSemester} onChange={(event) => setNewSemester(event.target.value)} placeholder="Semester (e.g., Sem 4)" />
            <Input value={newTags} onChange={(event) => setNewTags(event.target.value)} placeholder="Tags (comma-separated: dsa, revision, exam)" />
          </div>
          <div className="rounded-xl border border-dashed border-[rgb(var(--border-hover))] bg-[rgb(var(--surface-hover))] p-3 dark:border-slate-700 dark:bg-slate-800">
            <label className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] dark:text-slate-400">
              <FileUp size={14} />
              Attach Files or Images
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.gif,.svg,.txt"
              onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
              className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="mt-2 text-xs text-[rgb(var(--text-tertiary))] dark:text-slate-400">
              Max {Math.round(CLIENT_UPLOAD_MAX_BYTES / (1024 * 1024))}MB per file.
            </p>
            {uploadFiles.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadFiles.map((file) => (
                  <span key={`${file.name}-${file.size}`} className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--surface))] px-3 py-1 text-xs text-[rgb(var(--text-secondary))] dark:bg-slate-900 dark:text-slate-300">
                    {file.type.startsWith("image/") ? <ImageIcon size={12} /> : <FileUp size={12} />}
                    {file.name} ({formatFileSize(file.size)})
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button loading={creating} onClick={() => void createPublicNote()}>
              Publish Public Note
            </Button>
            <Link href="/auth/login" className="inline-flex items-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-hover))]">
              Sign in required for upload
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-1 text-xs text-[rgb(var(--text-secondary))] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Info size={12} />
            Uploaded public files will show up after expert verification.
          </div>
        </div>
      </Card>
      ) : null}

      {libraryMode === "all" ? (
      <Card title="Advanced Library Controls" description="Optional: customize category, semester, and tag presets used in uploads and filters.">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))]"
        >
          {advancedOpen ? "Hide Advanced Controls" : "Show Advanced Controls"}
          <ChevronDown size={14} className={advancedOpen ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
        {advancedOpen ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Categories</label>
              <div className="flex gap-2">
                <Input value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="Add category" />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const normalized = normalizeListItem(categoryDraft);
                    if (!normalized) return;
                    setCustomCategories((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
                    setCategoryDraft("");
                  }}
                >
                  <Plus size={14} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {customCategories.length === 0 ? (
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">No custom categories yet.</span>
                ) : (
                  customCategories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCustomCategories((prev) => prev.filter((value) => value !== item))}
                      className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-xs text-[rgb(var(--text-secondary))]"
                    >
                      {item}
                      <X size={11} />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Semesters</label>
              <div className="flex gap-2">
                <Input value={semesterDraft} onChange={(event) => setSemesterDraft(event.target.value)} placeholder="Add semester" />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const normalized = normalizeListItem(semesterDraft);
                    if (!normalized) return;
                    setCustomSemesters((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
                    setSemesterDraft("");
                  }}
                >
                  <Plus size={14} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {customSemesters.length === 0 ? (
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">No custom semesters yet.</span>
                ) : (
                  customSemesters.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCustomSemesters((prev) => prev.filter((value) => value !== item))}
                      className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-xs text-[rgb(var(--text-secondary))]"
                    >
                      {item}
                      <X size={11} />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Tags</label>
              <div className="flex gap-2">
                <Input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="Add tag" />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const normalized = normalizeListItem(tagDraft);
                    if (!normalized) return;
                    setCustomTags((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
                    setTagDraft("");
                  }}
                >
                  <Plus size={14} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {customTags.length === 0 ? (
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">No custom tags yet.</span>
                ) : (
                  customTags.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCustomTags((prev) => prev.filter((value) => value !== item))}
                      className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-xs text-[rgb(var(--text-secondary))]"
                    >
                      {item}
                      <X size={11} />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs text-[rgb(var(--text-secondary))] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Settings2 size={14} />
            Preferences are saved on this device and automatically applied to upload forms and filters.
          </div>
        </div>
        ) : (
            <p className="text-sm text-[rgb(var(--text-secondary))] dark:text-slate-300">
            Keep this collapsed if you just want to upload and browse without extra setup.
          </p>
        )}
      </Card>
      ) : null}

      {libraryMode !== "share" ? (
      <Card title="Find Notes Quickly" description="Search once, then narrow the library with cleaner study-focused controls.">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[rgb(var(--text-tertiary))]" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes by title, content, subject or tags..." className="pl-9" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
              <Select
                label="Category"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                options={[{ label: "All Categories", value: "" }, ...subjects.map((item) => ({ label: item, value: item }))]}
              />
              <Select
                label="Semester"
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                options={[{ label: "All Semesters", value: "" }, ...semesters.map((item) => ({ label: item, value: item }))]}
              />
              <Select
                label="Sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as "latest" | "oldest")}
                options={[
                  { label: "Latest first", value: "latest" },
                  { label: "Oldest first", value: "oldest" },
                ]}
              />
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSubject("");
                  setSemester("");
                  setTag("");
                  setSort("latest");
                  setTeacherOnly(false);
                }}
                className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters ? (
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">{visibleNotes.length} notes found</p>
            ) : null}

            <button
              type="button"
              onClick={() => setTeacherOnly((prev) => !prev)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                teacherOnly
                  ? "border-emerald-500/70 bg-emerald-100/80 text-emerald-700"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              }`}
            >
              {teacherOnly ? "Verified Teachers Only" : "All Contributors"}
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] dark:text-slate-400">View</span>
              <button
                type="button"
                onClick={() => setNoteView("grid")}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  noteView === "grid"
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))]"
                }`}
              >
                <LayoutGrid size={12} />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setNoteView("list")}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  noteView === "list"
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))]"
                }`}
              >
                <List size={12} />
                List
              </button>
            </div>
          </div>
          {topTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] dark:text-slate-400">Trending Tags</span>
              {topTags.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTag(item)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    tag === item
                      ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))]"
                  }`}
                >
                  <Tag size={11} />
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </Card>
      ) : null}

      <div id="browse" className="scroll-mt-24" />

      {libraryMode !== "share" && visibleNotes.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <p className="text-lg font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">No notes match these filters yet.</p>
            <p className="mt-2 text-sm text-[rgb(var(--text-secondary))] dark:text-slate-300">Try another subject, clear a few filters, or publish the first note by creating a free account.</p>
            <Link href="/auth/signup" className="btn btn-primary mt-4 inline-flex">
              Create free account →
            </Link>
          </div>
        </Card>
      ) : libraryMode !== "share" ? (
        <div className={noteView === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {visibleNotes.map((note) => (
            <Card key={note.id} className={`${noteView === "grid" ? "h-full" : ""} border-[rgb(var(--border))]/80 hover:border-[rgb(var(--primary))]/25`}>
              <div className={`flex gap-3 ${noteView === "grid" ? "h-full flex-col justify-between" : "flex-col sm:flex-row sm:items-start sm:justify-between"}`}>
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--primary-soft))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--primary))]">
                      <BookOpen size={12} />
                      {note.subject || "General"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[rgb(var(--text-tertiary))]">{new Date(note.createdAt).toLocaleDateString()}</span>
                      {note.noteVerificationStatus === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          <BadgeCheck size={10} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-warning)]" style={{ borderColor: "color-mix(in srgb, var(--color-warning) 50%, var(--color-border))", backgroundColor: "color-mix(in srgb, #FFFBEB 82%, transparent)" }}>
                          <Info size={10} />
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">{note.title}</h3>
                  <p className={`mt-2 text-sm text-[rgb(var(--text-secondary))] dark:text-slate-300 ${noteView === "grid" ? "line-clamp-3" : "line-clamp-2 sm:max-w-2xl"}`}>{note.content.replace(/<[^>]+>/g, "")}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--text-tertiary))] dark:text-slate-400">
                    <span>By {note.user.name}</span>
                    {note.semester ? <span className="rounded-full bg-[rgb(var(--surface-hover))] px-2 py-0.5 dark:bg-slate-900">{note.semester}</span> : null}
                    {isVerifiedTeacher(note.user) ? <span className="rounded-full px-2 py-0.5 text-[var(--color-success)]" style={{ backgroundColor: "var(--color-success-light)" }}>Teacher Contributor</span> : null}
                  </div>
                  {note.tags ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {note.tags
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((item) => (
                          <span key={item} className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] text-[rgb(var(--text-secondary))] dark:border-slate-700 dark:text-slate-300">
                            <Tag size={10} />
                            {item}
                          </span>
                        ))}
                    </div>
                  ) : null}
                  {note.attachments?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {note.attachments.slice(0, 3).map((attachment) => (
                        attachment.file.verificationStatus === "VERIFIED" ? (
                          <a
                            key={attachment.file.id}
                            href={`/api/notes/public/files/${attachment.file.id}`}
                            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            {attachment.file.originalName}
                          </a>
                        ) : (
                          <span
                            key={attachment.file.id}
                            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold text-[var(--color-warning)]"
                            style={{ borderColor: "color-mix(in srgb, var(--color-warning) 45%, var(--color-border))", backgroundColor: "color-mix(in srgb, #FFFBEB 82%, transparent)" }}
                          >
                            <Info size={10} />
                            {attachment.file.originalName} (Pending verification)
                          </span>
                        )
                      ))}
                    </div>
                  ) : null}
                </div>
                <Link
                  href={`/notes/${note.slug}`}
                  className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-hover))] ${
                    noteView === "list" ? "sm:min-w-40" : ""
                  }`}
                >
                  Open Full Note
                  <ArrowRight size={14} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {libraryMode !== "share" && hasMore ? (
        <div className="flex justify-center">
          <Button variant="secondary" loading={loading} onClick={() => void loadNotes({ reset: false, cursor })}>
            Load More Notes
          </Button>
        </div>
      ) : null}

      {libraryMode !== "share" ? (
      <Card title="Public Files & Images" description="Browse attached study assets without digging through full notes first.">
        <div className="mb-3 space-y-2">
          <Input value={filesSearch} onChange={(event) => setFilesSearch(event.target.value)} placeholder="Search public files..." />
          <div className="flex flex-wrap gap-2">
            {availableFileKinds.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setFileKindFilter(kind)}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  fileKindFilter === kind
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))]"
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>
        {visibleFiles.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] bg-[rgb(var(--surface-hover))] px-4 py-6 text-center text-sm text-[rgb(var(--text-secondary))] dark:bg-slate-800 dark:text-slate-300">
            No public files found for the current search.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleFiles.map((file) => (
              <div key={file.id} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/95 p-4 shadow-[var(--shadow-xs)] transition hover:border-[rgb(var(--primary))]/25 hover:shadow-[var(--shadow-sm)] dark:border-slate-700 dark:bg-slate-800/95 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">{file.originalName}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] dark:text-slate-400">{formatFileSize(file.size)}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] dark:text-slate-400">
                    By {file.user.name}
                    {isVerifiedTeacher(file.user) ? " | Teacher Contributor" : ""}
                  </p>
                  {file.verificationStatus === "VERIFIED" && file.verifiedBy ? (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      <BadgeCheck size={11} />
                      Verified by expert {file.verifiedBy.name}
                    </p>
                  ) : null}
                  <p className="mt-1 inline-flex rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    {inferFileKind(file.originalName)}
                  </p>
                </div>
                <a
                  href={`/api/files/public/${file.id}/download`}
                  className="inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-2.5 py-1.5 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Download size={12} />
                  Get
                </a>
                </div>
              </div>
            ))}
          </div>
        )}
        {filesHasMore ? (
          <div className="mt-4">
            <Button variant="secondary" loading={filesLoading} onClick={() => void loadFiles({ reset: false, cursor: filesCursor })}>
              Load More Files
            </Button>
          </div>
        ) : null}
      </Card>
      ) : null}
        </div>
      </div>
    </div>
  );
}
