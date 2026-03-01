import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  getFocusSuggestion,
  getMotivationLine,
  getSmartSuggestions,
  getWeeklyTargets,
} from "@/lib/student-insights";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const accessUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (accessUser?.role === "TEACHER") {
    redirect("/dashboard/teacher");
  }

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    notesCount,
    filesCount,
    assignmentsCount,
    examsCount,
    publicNotesCount,
    completedAssignments,
    overdueAssignments,
    plannerTodo,
    inProgressPlanner,
    recentNoteCount,
  ] = await Promise.all([
    prisma.note.count({ where: { userId, deletedAt: null } }),
    prisma.file.count({ where: { userId, deletedAt: null } }),
    prisma.assignment.count({ where: { userId } }),
    prisma.exam.count({ where: { userId } }),
    prisma.note.count({ where: { userId, deletedAt: null, isPublic: true } }),
    prisma.assignment.count({ where: { userId, status: "COMPLETED" } }),
    prisma.assignment.count({ where: { userId, status: { not: "COMPLETED" }, dueDate: { lt: now } } }),
    prisma.plannerItem.count({ where: { userId, status: "TODO" } }),
    prisma.plannerItem.count({ where: { userId, status: "IN_PROGRESS" } }),
    prisma.note.count({ where: { userId, deletedAt: null, createdAt: { gte: weekAgo } } }),
  ]);

  const [upcomingAssignments, upcomingExams, recentNotes] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId, dueDate: { not: null, gt: now } },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, dueDate: true, priority: true },
    }),
    prisma.exam.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 3,
      select: { id: true, subject: true, date: true, status: true },
    }),
    prisma.note.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const completionRate = assignmentsCount > 0 ? Math.round((completedAssignments / assignmentsCount) * 100) : 0;
  const pendingAssignments = Math.max(assignmentsCount - completedAssignments, 0);
  const publicShareRate = notesCount > 0 ? Math.round((publicNotesCount / notesCount) * 100) : 0;
  const nextExam = upcomingExams.find((exam) => exam.date > now);
  const daysToNextExam = nextExam
    ? Math.max(Math.ceil((nextExam.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0)
    : null;

  const workloadScore = Math.max(100 - overdueAssignments * 20 - pendingAssignments * 4 - plannerTodo * 2, 0);
  const productivityScore = Math.min(
    100,
    Math.round(completionRate * 0.55 + Math.min(recentNoteCount * 10, 30) + Math.min(inProgressPlanner * 5, 15)),
  );
  const focusHealth = Math.round((workloadScore + productivityScore) / 2);

  const motivationLine = getMotivationLine({
    upcomingExams: upcomingExams.length,
    pendingAssignments,
    overdueAssignments,
    plannerTodo,
  });

  const smartSuggestions = getSmartSuggestions({
    overdueAssignments,
    pendingAssignments,
    plannerTodo,
    recentNoteCount,
    upcomingExams: upcomingExams.length,
    daysToNextExam,
  });

  const focusSuggestion = getFocusSuggestion({
    focusHealth,
    workloadScore,
    productivityScore,
    upcomingDeadlineCount: upcomingAssignments.length + upcomingExams.length,
  });

  const weeklyTargets = getWeeklyTargets({
    pendingAssignments,
    overdueAssignments,
    recentNoteCount,
    plannerTodo,
  });

  const stats = [
    { label: "Notes", value: notesCount, icon: FileText, href: "/dashboard/notes" },
    { label: "Files", value: filesCount, icon: BookOpen, href: "/dashboard/my-files" },
    { label: "Assignments", value: assignmentsCount, icon: CheckCircle2, href: "/dashboard/assignments" },
    { label: "Exams", value: examsCount, icon: Calendar, href: "/dashboard/exams" },
  ];

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const smartInsights = [
    {
      title: "Focus Health",
      value: `${focusHealth}%`,
      icon: BarChart3,
      tone:
        focusHealth >= 75
          ? "text-[rgb(var(--success))]"
          : focusHealth >= 50
            ? "text-[rgb(var(--warning))]"
            : "text-[rgb(var(--error))]",
      message:
        focusHealth >= 75
          ? "Your current flow is strong. Maintain consistency."
          : focusHealth >= 50
            ? "You are stable, but can improve by closing pending tasks."
            : "High pressure detected. Prioritize overdue items today.",
    },
    {
      title: "Content Momentum",
      value: `${recentNoteCount} notes / 7d`,
      icon: Flame,
      tone: "text-[rgb(var(--primary))]",
      message: recentNoteCount >= 5 ? "Great note-taking cadence." : "Try to capture at least one new note daily.",
    },
    {
      title: "Readiness",
      value: daysToNextExam !== null ? `${daysToNextExam} days to next exam` : "No upcoming exam",
      icon: Target,
      tone: "text-[rgb(var(--warning))]",
      message:
        daysToNextExam !== null && daysToNextExam <= 7
          ? "Exam window is near. Shift focus to revision sets."
          : "Use current window to build strong concept summaries.",
    },
  ] as const;

  const quickActions = [
    { label: "Create Note", href: "/dashboard/notes", hint: "Capture a fresh concept summary", icon: FileText },
    { label: "Upload Files", href: "/dashboard/upload-center", hint: "Add PDFs, slides, and diagrams", icon: BookOpen },
    { label: "Plan Week", href: "/dashboard/planner", hint: "Schedule focused study blocks", icon: Calendar },
    { label: "Open Analytics", href: "/dashboard/analytics", hint: "Review consistency and risks", icon: BarChart3 },
  ] as const;

  const scoreBreakdown = [
    { label: "Workload", value: workloadScore, tone: "from-amber-500 to-orange-500" },
    { label: "Productivity", value: productivityScore, tone: "from-emerald-500 to-teal-500" },
    { label: "Focus", value: focusHealth, tone: "from-sky-500 to-cyan-500" },
  ] as const;

  return (
    <div className="space-y-7">
      <section className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-6 shadow-[var(--shadow-sm)] md:p-8">
        <PageHeader
          title="Welcome back"
          description="Track your progress, keep deadlines visible, and keep all study materials in one calm workspace."
          insight={motivationLine}
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2.5 text-[rgb(var(--primary))]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-[rgb(var(--success))]" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">{stat.value}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {smartInsights.map((insight) => {
          const Icon = insight.icon;
          return (
            <article key={insight.title} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">{insight.title}</h3>
                <Icon className={`h-5 w-5 ${insight.tone}`} />
              </div>
              <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{insight.value}</p>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{insight.message}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Action Center</h3>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">High-impact shortcuts to keep your study workflow moving.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-3 transition hover:border-[rgb(var(--border-focus))] hover:bg-[rgb(var(--surface-active))]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-primary))]">
                      <Icon className="h-4 w-4 text-[rgb(var(--primary))]" />
                      {action.label}
                    </span>
                    <TrendingUp className="h-4 w-4 text-[rgb(var(--success))]" />
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--text-secondary))]">{action.hint}</p>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Performance Breakdown</h3>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Live indicators generated from your workload and completion behavior.</p>
          <div className="mt-4 space-y-3">
            {scoreBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--text-secondary))]">{item.label}</span>
                  <strong className="text-[rgb(var(--text-primary))]">{item.value}%</strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-hover))]">
                  <div className={`h-full rounded-full bg-gradient-to-r ${item.tone}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Assignment Progress</h3>
            <CheckCircle2 className="h-5 w-5 text-[rgb(var(--success))]" />
          </div>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {completedAssignments} of {assignmentsCount} completed
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--surface-hover))]">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="mt-3 text-xs font-medium text-[rgb(var(--text-tertiary))]">{completionRate}% completion rate</p>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="mb-4 text-base font-semibold text-[rgb(var(--text-primary))]">Study Library</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5">
              <span className="text-[rgb(var(--text-secondary))]">Public notes</span>
              <strong className="text-[rgb(var(--text-primary))]">{publicNotesCount}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5">
              <span className="text-[rgb(var(--text-secondary))]">Private notes</span>
              <strong className="text-[rgb(var(--text-primary))]">{Math.max(notesCount - publicNotesCount, 0)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5">
              <span className="text-[rgb(var(--text-secondary))]">Share readiness</span>
              <strong className="text-[rgb(var(--text-primary))]">{publicShareRate}%</strong>
            </div>
          </div>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="mb-4 text-base font-semibold text-[rgb(var(--text-primary))]">Risk Monitor</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5">
              <span className="text-[rgb(var(--text-secondary))]">Overdue assignments</span>
              <strong className={overdueAssignments > 0 ? "text-[rgb(var(--error))]" : "text-[rgb(var(--text-primary))]"}>{overdueAssignments}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5">
              <span className="text-[rgb(var(--text-secondary))]">Planner TODO</span>
              <strong className="text-[rgb(var(--text-primary))]">{plannerTodo}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5">
              <span className="text-[rgb(var(--text-secondary))]">In progress</span>
              <strong className="text-[rgb(var(--text-primary))]">{inProgressPlanner}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] px-5 py-4">
            <Clock3 className="h-5 w-5 text-[rgb(var(--warning))]" />
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Upcoming Deadlines</h3>
          </div>
          <div className="divide-y divide-[rgb(var(--border))]">
            {upcomingAssignments.length === 0 && upcomingExams.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[rgb(var(--text-secondary))]">No upcoming deadlines.</p>
            ) : (
              <>
                {upcomingAssignments.map((item) => (
                  <Link key={`a-${item.id}`} href="/dashboard/assignments" className="block px-5 py-4 hover:bg-[rgb(var(--surface-hover))]">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{item.title}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                      Due {item.dueDate ? formatDate(item.dueDate) : "Unknown"} | {item.priority}
                    </p>
                  </Link>
                ))}
                {upcomingExams.map((item) => (
                  <Link key={`e-${item.id}`} href="/dashboard/exams" className="block px-5 py-4 hover:bg-[rgb(var(--surface-hover))]">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{item.subject} exam</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                      {formatDate(item.date)} | {item.status}
                    </p>
                  </Link>
                ))}
              </>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] px-5 py-4">
            <FileText className="h-5 w-5 text-[rgb(var(--primary))]" />
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Recent Notes</h3>
          </div>
          <div className="divide-y divide-[rgb(var(--border))]">
            {recentNotes.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[rgb(var(--text-secondary))]">No notes yet.</p>
            ) : (
              recentNotes.map((note) => (
                <div key={note.id} className="px-5 py-4">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{note.title}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                    {new Date(note.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[rgb(var(--text-primary))]">
            <Lightbulb className="h-4 w-4 text-[rgb(var(--warning))]" />
            Smart Suggestions
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--text-secondary))]">
            {smartSuggestions.map((item, index) => (
              <li key={`${index}-${item}`}>{index + 1}. {item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[rgb(var(--text-primary))]">
            <Flame className="h-4 w-4 text-[rgb(var(--primary))]" />
            This Week Targets
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            {weeklyTargets.map((target) => (
              <div key={target.label} className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2">
                <span className="text-[rgb(var(--text-secondary))]">{target.label}</span>
                <strong className="text-[rgb(var(--text-primary))]">{target.value}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[rgb(var(--text-primary))]">
            {overdueAssignments > 0 ? (
              <AlertTriangle className="h-4 w-4 text-[rgb(var(--error))]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[rgb(var(--success))]" />
            )}
            Focus Suggestion
          </h3>
          <p className="mt-3 text-sm text-[rgb(var(--text-secondary))]">{focusSuggestion}</p>
        </article>
      </section>
    </div>
  );
}
