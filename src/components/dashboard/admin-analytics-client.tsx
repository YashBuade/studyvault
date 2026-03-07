"use client";

import { useCallback, useMemo, useState } from "react";
import { useEffect } from "react";
import { Activity, Clock3, Download, FileText, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useToast } from "@/src/components/ui/toast-provider";

type RecentUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "TEACHER" | "ADMIN";
  createdAt: string;
};

type RecentNote = {
  id: number;
  title: string;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

type MostActiveUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "TEACHER" | "ADMIN";
  score: number;
  notes: number;
  files: number;
  resources: number;
  assignments: number;
  exams: number;
};

type MostDownloadedNote = {
  id: number;
  title: string;
  authorName: string;
  createdAt: string;
  engagementScore: number;
  likes: number;
  comments: number;
  bookmarks: number;
  shares: number;
  attachments: number;
};

type ActivityPoint = {
  date: string;
  label: string;
  newUsers: number;
  newNotes: number;
  newFiles: number;
  totalActivity: number;
};

type CurrentlyActiveUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "TEACHER" | "ADMIN";
  lastActivityAt: string;
  actionCount: number;
  activeSources: string[];
};

type AdminAnalytics = {
  totalUsers: number;
  totalTeachers: number;
  totalNotes: number;
  publicNotes: number;
  privateNotes: number;
  totalResources: number;
  totalAssignments: number;
  totalExams: number;
  totalStorageUsedBytes: number;
  recentUsers: RecentUser[];
  recentNotes: RecentNote[];
  mostActiveUsers: MostActiveUser[];
  mostDownloadedNotes: MostDownloadedNote[];
  notesUploadedLastWeek: number;
  activityLast7Days: ActivityPoint[];
  currentlyActiveUsers: CurrentlyActiveUser[];
  currentlyActiveCount: number;
  activityWindowMinutes: number;
  generatedAt: string;
  mostDownloadedNotesMetric: string;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: {
    message?: string;
  };
};

type ReportSnapshot = {
  generatedAt: string;
  analytics: AdminAnalytics;
};

const POLL_INTERVAL_MS = 12_000;

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatStorage(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

async function buildPdfReport(snapshot: ReportSnapshot) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const lineHeight = 5.8;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;
  const analytics = snapshot.analytics;

  const ensureSpace = (needed = lineHeight) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  const addLine = (text: string, options?: { bold?: boolean; size?: number; color?: [number, number, number] }) => {
    ensureSpace();
    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(options?.size ?? 10);
    if (options?.color) doc.setTextColor(...options.color);
    else doc.setTextColor(33, 37, 41);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    for (const line of lines) {
      ensureSpace();
      doc.text(line, margin, y);
      y += lineHeight;
    }
  };

  const addSectionTitle = (title: string, color: [number, number, number]) => {
    ensureSpace(11);
    y += 2;
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(margin, y - 4, contentWidth, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin + 3, y + 0.2);
    y += 6;
  };

  const addSummaryCards = (cards: Array<{ label: string; value: string; color: [number, number, number] }>) => {
    const cols = 3;
    const gap = 4;
    const cardWidth = (contentWidth - gap * (cols - 1)) / cols;
    const cardHeight = 15;
    cards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = margin + col * (cardWidth + gap);
      const top = y + row * (cardHeight + gap);
      ensureSpace(cardHeight + 2);
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.roundedRect(x, top, cardWidth, cardHeight, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(card.value, x + 2.2, top + 6.2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(card.label, x + 2.2, top + 11.8);
    });
    y += Math.ceil(cards.length / cols) * (cardHeight + gap) + 1;
  };

  const addTable = (headers: string[], rows: string[][], colWidths: number[]) => {
    const rowHeight = 6.5;
    const drawHeader = () => {
      doc.setFillColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
      let x = margin + 1.5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      headers.forEach((header, index) => {
        doc.text(header, x, y + 4.2);
        x += colWidths[index];
      });
      y += rowHeight;
    };

    ensureSpace(rowHeight * 2);
    drawHeader();
    rows.forEach((row, rowIndex) => {
      if (y + rowHeight > pageHeight - 16) {
        doc.addPage();
        y = 18;
        drawHeader();
      }
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowHeight, "F");
      }
      let x = margin + 1.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8.3);
      row.forEach((cell, index) => {
        doc.text(cell, x, y + 4.2, { maxWidth: colWidths[index] - 2 });
        x += colWidths[index];
      });
      y += rowHeight;
    });
    y += 2;
  };

  const activityTotal7Days = analytics.activityLast7Days.reduce((sum, item) => sum + item.totalActivity, 0);
  const averageDailyActivity = analytics.activityLast7Days.length
    ? (activityTotal7Days / analytics.activityLast7Days.length).toFixed(1)
    : "0.0";
  const peakDay = analytics.activityLast7Days.reduce<ActivityPoint | null>((best, point) => {
    if (!best || point.totalActivity > best.totalActivity) return point;
    return best;
  }, null);

  doc.setFillColor(30, 64, 175);
  doc.roundedRect(margin, 10, contentWidth, 21, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("StudyVault Admin Report", margin + 4, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${formatDateTime(snapshot.generatedAt)}`, margin + 4, 26);
  doc.text(`Data Snapshot: ${formatDateTime(analytics.generatedAt)}`, margin + 98, 26);
  y = 35;

  addSummaryCards([
    { label: "Total Users", value: analytics.totalUsers.toLocaleString(), color: [37, 99, 235] },
    { label: "Total Teachers", value: analytics.totalTeachers.toLocaleString(), color: [14, 116, 144] },
    { label: "Active Users", value: analytics.currentlyActiveCount.toLocaleString(), color: [234, 88, 12] },
    { label: "Total Notes", value: analytics.totalNotes.toLocaleString(), color: [5, 150, 105] },
    { label: "Notes (7 days)", value: analytics.notesUploadedLastWeek.toLocaleString(), color: [126, 34, 206] },
    { label: "Storage Used", value: formatStorage(analytics.totalStorageUsedBytes), color: [79, 70, 229] },
  ]);

  addSectionTitle("System Overview", [15, 118, 110]);
  addTable(
    ["Metric", "Value", "Metric", "Value"],
    [
      ["Public Notes", analytics.publicNotes.toLocaleString(), "Private Notes", analytics.privateNotes.toLocaleString()],
      ["Resources", analytics.totalResources.toLocaleString(), "Assignments", analytics.totalAssignments.toLocaleString()],
      ["Exams", analytics.totalExams.toLocaleString(), "Storage", formatStorage(analytics.totalStorageUsedBytes)],
    ],
    [44, 28, 44, 28],
  );

  addSectionTitle("Currently Active Users", [217, 119, 6]);
  addLine(`Active window: last ${analytics.activityWindowMinutes} minutes`, { size: 9.5, color: [100, 116, 139] });
  if (analytics.currentlyActiveUsers.length === 0) {
    addLine("No active users detected in the current window.");
  } else {
    addTable(
      ["Name", "Role", "Actions", "Last Activity"],
      analytics.currentlyActiveUsers.map((user) => [
        user.name,
        user.role,
        String(user.actionCount),
        formatDateTime(user.lastActivityAt),
      ]),
      [62, 24, 22, 66],
    );
  }

  addSectionTitle("Daily Activity (Last 7 Days)", [29, 78, 216]);
  addLine("Formula: Daily Activity = New Users + New Notes + New Uploads", { size: 9.2, color: [71, 85, 105] });
  addLine(`Average per day: ${averageDailyActivity} | Peak day: ${peakDay ? `${peakDay.label} (${peakDay.totalActivity})` : "N/A"}`, {
    size: 9.2,
    color: [71, 85, 105],
  });
  addTable(
    ["Day", "Date", "Users", "Notes", "Uploads", "Total"],
    analytics.activityLast7Days.map((item) => [
      item.label,
      item.date,
      String(item.newUsers),
      String(item.newNotes),
      String(item.newFiles),
      String(item.totalActivity),
    ]),
    [18, 32, 20, 20, 22, 20],
  );

  addSectionTitle("Recent User Registrations", [22, 163, 74]);
  if (analytics.recentUsers.length === 0) {
    addLine("No recent registrations.");
  } else {
    addTable(
      ["Name", "Email", "Role", "Registered"],
      analytics.recentUsers.map((user) => [user.name, user.email, user.role, formatDateTime(user.createdAt)]),
      [36, 72, 20, 46],
    );
  }

  addSectionTitle("Recently Uploaded Notes", [14, 116, 144]);
  if (analytics.recentNotes.length === 0) {
    addLine("No recent notes.");
  } else {
    addTable(
      ["Title", "Owner", "Visibility", "Uploaded"],
      analytics.recentNotes.map((note) => [note.title, note.user.name, note.isPublic ? "Public" : "Private", formatDateTime(note.createdAt)]),
      [72, 36, 22, 44],
    );
  }

  addSectionTitle("Most Active Users", [126, 34, 206]);
  if (analytics.mostActiveUsers.length === 0) {
    addLine("No active user data available.");
  } else {
    addTable(
      ["Name", "Score", "Notes", "Files", "Resources", "Tasks"],
      analytics.mostActiveUsers.map((user) => [
        user.name,
        String(user.score),
        String(user.notes),
        String(user.files),
        String(user.resources),
        String(user.assignments + user.exams),
      ]),
      [62, 20, 18, 18, 24, 22],
    );
  }

  addSectionTitle("Most Downloaded Notes (Engagement Proxy)", [220, 38, 38]);
  if (analytics.mostDownloadedNotes.length === 0) {
    addLine("No engagement note data available.");
  } else {
    addTable(
      ["Title", "Author", "Engagement Score"],
      analytics.mostDownloadedNotes.map((note) => [note.title, note.authorName, String(note.engagementScore)]),
      [100, 58, 32],
    );
  }

  const datePart = new Date(snapshot.generatedAt).toISOString().slice(0, 10);
  doc.save(`studyvault-admin-report-${datePart}.pdf`);
}

export function AdminAnalyticsClient() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportSnapshot, setReportSnapshot] = useState<ReportSnapshot | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { pushToast } = useToast();

  const fetchAnalytics = useCallback(
    async (showRefreshingState: boolean) => {
      try {
        if (showRefreshingState) setRefreshing(true);
        const response = await fetch("/api/admin/analytics", {
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiResponse<AdminAnalytics>;
        if (!response.ok || !payload.ok || !payload.data) {
          setError(payload.error?.message ?? "Unable to load analytics.");
          return;
        }
        setAnalytics(payload.data);
        setError(null);
      } catch {
        setError("Unable to load analytics.");
      } finally {
        setLoading(false);
        if (showRefreshingState) setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchAnalytics(false);
    const timer = window.setInterval(() => {
      void fetchAnalytics(false);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [fetchAnalytics]);

  const statCards = useMemo(() => {
    if (!analytics) return [];
    return [
      { label: "Total Users", value: analytics.totalUsers.toLocaleString() },
      { label: "Total Teachers", value: analytics.totalTeachers.toLocaleString() },
      { label: "Active Users Now", value: analytics.currentlyActiveCount.toLocaleString() },
      { label: "Total Notes", value: analytics.totalNotes.toLocaleString() },
      { label: "Public Notes", value: analytics.publicNotes.toLocaleString() },
      { label: "Private Notes", value: analytics.privateNotes.toLocaleString() },
      { label: "Total Resources", value: analytics.totalResources.toLocaleString() },
      { label: "Total Assignments", value: analytics.totalAssignments.toLocaleString() },
      { label: "Total Exams", value: analytics.totalExams.toLocaleString() },
      { label: "Notes Last 7 Days", value: analytics.notesUploadedLastWeek.toLocaleString() },
      { label: "Storage Used", value: formatStorage(analytics.totalStorageUsedBytes) },
    ];
  }, [analytics]);

  const dailyActivitySummary = useMemo(() => {
    if (!analytics) return null;
    const points = analytics.activityLast7Days;
    const total = points.reduce((sum, point) => sum + point.totalActivity, 0);
    const avg = points.length ? total / points.length : 0;
    const peak = points.reduce<ActivityPoint | null>((best, point) => {
      if (!best || point.totalActivity > best.totalActivity) return point;
      return best;
    }, null);
    const latest = points[points.length - 1];
    const previous = points[points.length - 2];
    const delta = latest && previous ? latest.totalActivity - previous.totalActivity : 0;
    return { total, avg, peak, latest, delta };
  }, [analytics]);

  const generateReport = () => {
    if (!analytics) {
      pushToast("No analytics data loaded yet.", "error");
      return;
    }
    const snapshot: ReportSnapshot = {
      generatedAt: new Date().toISOString(),
      analytics,
    };
    setReportSnapshot(snapshot);
    setReportModalOpen(true);
    pushToast("Report generated.", "success");
  };

  const downloadReportPdf = async () => {
    if (!reportSnapshot) {
      pushToast("Generate a report first.", "error");
      return;
    }
    try {
      setDownloadingPdf(true);
      await buildPdfReport(reportSnapshot);
      pushToast("PDF download started.", "success");
    } catch {
      pushToast("Failed to build PDF.", "error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!analytics || error) {
    return (
      <Card title="Admin Analytics" description="Unable to load analytics right now.">
        <p className="text-sm text-[rgb(var(--text-secondary))]">{error ?? "Unknown error."}</p>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => void fetchAnalytics(true)} loading={refreshing}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-br from-[rgb(var(--surface))] via-[rgb(var(--surface-hover))] to-[rgb(var(--background-alt))]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--primary))]">Real-time Admin Analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Platform Activity Monitor</h2>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              Auto-refresh every 12 seconds. Last updated: {formatDateTime(analytics.generatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => void fetchAnalytics(true)} loading={refreshing}>
              <RefreshCw className="h-4 w-4" />
              Refresh now
            </Button>
            <Button onClick={generateReport}>
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-amber-300/60 bg-gradient-to-r from-amber-50/70 via-orange-50/70 to-rose-50/70 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-rose-900/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
              <Activity className="h-3.5 w-3.5" />
              Live Access Window
            </p>
            <p className="mt-1 text-lg font-semibold text-[rgb(var(--text-primary))]">
              {analytics.currentlyActiveCount} users active in the last {analytics.activityWindowMinutes} minutes
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              Activity is inferred from note/file/resource/planner/exam/content interactions.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-amber-300/70 bg-white/70 px-4 py-3 text-right dark:bg-black/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Current activity</p>
            <p className="text-3xl font-semibold text-[rgb(var(--text-primary))]">{analytics.currentlyActiveCount}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((item) => (
          <Card key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-primary))]">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card title="Who Is Currently Accessing The Website" description={`Live activity from the last ${analytics.activityWindowMinutes} minutes`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] text-[rgb(var(--text-tertiary))]">
                <th className="px-2 py-2 font-semibold">User</th>
                <th className="px-2 py-2 font-semibold">Role</th>
                <th className="px-2 py-2 font-semibold">Actions</th>
                <th className="px-2 py-2 font-semibold">Signals</th>
                <th className="px-2 py-2 font-semibold">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {analytics.currentlyActiveUsers.map((user) => (
                <tr key={user.id} className="border-b border-[rgb(var(--border))]/60">
                  <td className="px-2 py-2">
                    <p className="font-medium text-[rgb(var(--text-primary))]">{user.name}</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">{user.email}</p>
                  </td>
                  <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{user.role}</td>
                  <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{user.actionCount}</td>
                  <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{user.activeSources.join(", ")}</td>
                  <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{formatDateTime(user.lastActivityAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {analytics.currentlyActiveUsers.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[rgb(var(--text-secondary))]">No active users detected right now.</p>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Activity Trend (Last 7 Days)" description="New users, notes, and uploads">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.activityLast7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, borderColor: "rgba(148,163,184,0.5)" }} />
                <Legend />
                <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="newNotes" name="New Notes" stroke="#059669" strokeWidth={2} />
                <Line type="monotone" dataKey="newFiles" name="New Uploads" stroke="#ea580c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Total Daily Activity" description="Formula: Daily Activity = New Users + New Notes + New Uploads">
          {dailyActivitySummary ? (
            <div className="mb-3 grid gap-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-[rgb(var(--text-tertiary))]">7-day total</p>
                <p className="text-base font-semibold text-[rgb(var(--text-primary))]">{dailyActivitySummary.total}</p>
              </div>
              <div>
                <p className="text-[rgb(var(--text-tertiary))]">Daily average</p>
                <p className="text-base font-semibold text-[rgb(var(--text-primary))]">{dailyActivitySummary.avg.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[rgb(var(--text-tertiary))]">Peak day</p>
                <p className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  {dailyActivitySummary.peak ? `${dailyActivitySummary.peak.label} (${dailyActivitySummary.peak.totalActivity})` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[rgb(var(--text-tertiary))]">Day-over-day</p>
                <p className={`text-base font-semibold ${dailyActivitySummary.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {dailyActivitySummary.delta >= 0 ? "+" : ""}
                  {dailyActivitySummary.delta}
                </p>
              </div>
            </div>
          ) : null}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.activityLast7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, borderColor: "rgba(148,163,184,0.5)" }} />
                <Legend />
                <Bar dataKey="newUsers" name="Users" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="newNotes" name="Notes" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="newFiles" name="Uploads" fill="#ea580c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-[rgb(var(--text-tertiary))]">
                  <th className="px-2 py-2 font-semibold">Day</th>
                  <th className="px-2 py-2 font-semibold">Users</th>
                  <th className="px-2 py-2 font-semibold">Notes</th>
                  <th className="px-2 py-2 font-semibold">Uploads</th>
                  <th className="px-2 py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {analytics.activityLast7Days.map((item) => (
                  <tr key={item.date} className="border-b border-[rgb(var(--border))]/60">
                    <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{item.label}</td>
                    <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{item.newUsers}</td>
                    <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{item.newNotes}</td>
                    <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{item.newFiles}</td>
                    <td className="px-2 py-2 font-semibold text-[rgb(var(--text-primary))]">{item.totalActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Recently Registered Users">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-[rgb(var(--text-tertiary))]">
                  <th className="px-2 py-2 font-semibold">Name</th>
                  <th className="px-2 py-2 font-semibold">Role</th>
                  <th className="px-2 py-2 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[rgb(var(--border))]/60">
                    <td className="px-2 py-2">
                      <p className="font-medium text-[rgb(var(--text-primary))]">{user.name}</p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">{user.email}</p>
                    </td>
                    <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{user.role}</td>
                    <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Recently Uploaded Notes">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-[rgb(var(--text-tertiary))]">
                  <th className="px-2 py-2 font-semibold">Title</th>
                  <th className="px-2 py-2 font-semibold">Visibility</th>
                  <th className="px-2 py-2 font-semibold">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentNotes.map((note) => (
                  <tr key={note.id} className="border-b border-[rgb(var(--border))]/60">
                    <td className="px-2 py-2">
                      <p className="font-medium text-[rgb(var(--text-primary))]">{note.title}</p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">{note.user.name}</p>
                    </td>
                    <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{note.isPublic ? "Public" : "Private"}</td>
                    <td className="px-2 py-2 text-[rgb(var(--text-secondary))]">{formatDateTime(note.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Most Active Users" description="Based on notes, files, resources, assignments, and exams">
          <div className="space-y-2">
            {analytics.mostActiveUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{user.name}</p>
                  <p className="truncate text-xs text-[rgb(var(--text-tertiary))]">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{user.score}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">activity score</p>
                </div>
              </div>
            ))}
            {analytics.mostActiveUsers.length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-secondary))]">No activity records found.</p>
            ) : null}
          </div>
        </Card>

        <Card
          title="Most Downloaded Notes"
          description={analytics.mostDownloadedNotesMetric === "engagement_proxy" ? "Approximated using engagement signals." : undefined}
        >
          <div className="space-y-2">
            {analytics.mostDownloadedNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{note.title}</p>
                  <p className="truncate text-xs text-[rgb(var(--text-tertiary))]">{note.authorName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{note.engagementScore}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">engagement</p>
                </div>
              </div>
            ))}
            {analytics.mostDownloadedNotes.length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-secondary))]">No public-note engagement data found.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <Modal
        open={reportModalOpen}
        title="StudyVault Admin Report Preview"
        description={reportSnapshot ? `Generated at ${formatDateTime(reportSnapshot.generatedAt)}` : undefined}
        onClose={() => setReportModalOpen(false)}
        cancelLabel="Close"
      >
        {reportSnapshot ? (
          <div className="max-h-[60vh] overflow-y-auto text-sm">
            <div className="space-y-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-3">
              <p className="font-semibold text-[rgb(var(--text-primary))]">System Overview</p>
              <p>Total users: {reportSnapshot.analytics.totalUsers}</p>
              <p>Currently active users: {reportSnapshot.analytics.currentlyActiveCount}</p>
              <p>Total teachers: {reportSnapshot.analytics.totalTeachers}</p>
              <p>Total notes: {reportSnapshot.analytics.totalNotes}</p>
              <p>Public notes: {reportSnapshot.analytics.publicNotes}</p>
              <p>Private notes: {reportSnapshot.analytics.privateNotes}</p>
              <p>Total resources: {reportSnapshot.analytics.totalResources}</p>
              <p>Total assignments: {reportSnapshot.analytics.totalAssignments}</p>
              <p>Total exams: {reportSnapshot.analytics.totalExams}</p>
              <p>Total storage used: {formatStorage(reportSnapshot.analytics.totalStorageUsedBytes)}</p>
            </div>

            <div className="mt-3 space-y-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-3">
              <p className="font-semibold text-[rgb(var(--text-primary))]">Currently Active Users</p>
              <ul className="space-y-1 text-xs text-[rgb(var(--text-secondary))]">
                {reportSnapshot.analytics.currentlyActiveUsers.map((user) => (
                  <li key={user.id}>
                    {user.name} ({user.role}) - {user.actionCount} actions - {formatDateTime(user.lastActivityAt)}
                  </li>
                ))}
                {reportSnapshot.analytics.currentlyActiveUsers.length === 0 ? <li>No active users detected.</li> : null}
              </ul>
            </div>

            <div className="mt-3 space-y-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-3">
              <p className="font-semibold text-[rgb(var(--text-primary))]">Recent User Registrations</p>
              <ul className="space-y-1 text-xs text-[rgb(var(--text-secondary))]">
                {reportSnapshot.analytics.recentUsers.map((user) => (
                  <li key={user.id}>
                    {user.name} ({user.email}) - {user.role} - {formatDateTime(user.createdAt)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 space-y-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-3">
              <p className="font-semibold text-[rgb(var(--text-primary))]">Recently Uploaded Notes</p>
              <ul className="space-y-1 text-xs text-[rgb(var(--text-secondary))]">
                {reportSnapshot.analytics.recentNotes.map((note) => (
                  <li key={note.id}>
                    {note.title} by {note.user.name} - {note.isPublic ? "Public" : "Private"} - {formatDateTime(note.createdAt)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 flex justify-end">
              <Button onClick={() => void downloadReportPdf()} loading={downloadingPdf}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-tertiary))]">
        <Clock3 className="h-4 w-4" />
        Real-time update via polling every {POLL_INTERVAL_MS / 1000} seconds. Active window: {analytics.activityWindowMinutes} minutes.
      </div>
    </div>
  );
}
