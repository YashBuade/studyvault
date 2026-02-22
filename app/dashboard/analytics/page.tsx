import { redirect } from "next/navigation";
import { AlertTriangle, CalendarClock, CheckCircle2, Flame, MessageSquare, NotebookPen, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/src/components/ui/card";

export default async function AnalyticsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalNotes,
    publicNotes,
    notesThisWeek,
    totalAssignments,
    completedAssignments,
    upcomingAssignments,
    overdueAssignments,
    upcomingExams,
    totalLikes,
    totalComments,
    totalBookmarks,
    totalRatings,
  ] = await Promise.all([
    prisma.note.count({ where: { userId, deletedAt: null } }),
    prisma.note.count({ where: { userId, deletedAt: null, isPublic: true } }),
    prisma.note.count({ where: { userId, deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
    prisma.assignment.count({ where: { userId } }),
    prisma.assignment.count({ where: { userId, status: "COMPLETED" } }),
    prisma.assignment.count({ where: { userId, dueDate: { gte: now } } }),
    prisma.assignment.count({ where: { userId, status: { not: "COMPLETED" }, dueDate: { lt: now } } }),
    prisma.exam.count({ where: { userId, date: { gte: now } } }),
    prisma.noteLike.count({ where: { note: { userId } } }),
    prisma.noteComment.count({ where: { note: { userId } } }),
    prisma.noteBookmark.count({ where: { note: { userId } } }),
    prisma.noteRating.count({ where: { note: { userId } } }),
  ]);

  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
  const publicShareRate = totalNotes > 0 ? Math.round((publicNotes / totalNotes) * 100) : 0;
  const engagementScore = totalLikes + totalComments + totalBookmarks + totalRatings;
  const consistencyScore = Math.min(100, Math.round(notesThisWeek * 12 + completionRate * 0.35));
  const readinessScore = Math.max(0, Math.min(100, Math.round(100 - overdueAssignments * 18 + upcomingExams * 4)));
  const riskLevel = overdueAssignments === 0 ? "Low" : overdueAssignments <= 2 ? "Moderate" : "High";

  const weeklyStatus =
    notesThisWeek >= 7 ? "Excellent weekly consistency" : notesThisWeek >= 3 ? "Good weekly consistency" : "Low weekly activity";

  return (
    <div className="space-y-7">
      <section className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] via-[rgb(var(--surface-hover))] to-[rgb(var(--background-alt))] p-6 shadow-[var(--shadow-sm)]">
        <PageHeader
          title="Analytics"
          description="Actionable study insights: workload, consistency, and progress indicators to help you stay ahead."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Consistency</p>
            <p className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">{consistencyScore}%</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Readiness</p>
            <p className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">{readinessScore}%</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Risk Level</p>
            <p className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">{riskLevel}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgb(var(--text-secondary))]">Assignment Completion</p>
            <CheckCircle2 className="h-4 w-4 text-[rgb(var(--success))]" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{completionRate}%</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">{completedAssignments} of {totalAssignments} completed</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgb(var(--text-secondary))]">Notes This Week</p>
            <NotebookPen className="h-4 w-4 text-[rgb(var(--primary))]" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{notesThisWeek}</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">{weeklyStatus}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgb(var(--text-secondary))]">Upcoming Tasks</p>
            <CalendarClock className="h-4 w-4 text-[rgb(var(--warning))]" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{upcomingAssignments + upcomingExams}</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
            {upcomingAssignments} assignments, {upcomingExams} exams
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgb(var(--text-secondary))]">Overdue Items</p>
            <AlertTriangle className="h-4 w-4 text-[rgb(var(--error))]" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--text-primary))]">{overdueAssignments}</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
            {overdueAssignments === 0 ? "No overdue assignments" : "Needs immediate attention"}
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Study Output" description="How consistently you are capturing and sharing knowledge.">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5 text-sm">
              <span className="text-[rgb(var(--text-secondary))]">Total notes</span>
              <strong className="text-[rgb(var(--text-primary))]">{totalNotes}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5 text-sm">
              <span className="text-[rgb(var(--text-secondary))]">Public share rate</span>
              <strong className="text-[rgb(var(--text-primary))]">{publicShareRate}%</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5 text-sm">
              <span className="text-[rgb(var(--text-secondary))]">Weekly activity tag</span>
              <strong className="text-[rgb(var(--text-primary))]">{notesThisWeek >= 7 ? "High" : notesThisWeek >= 3 ? "Medium" : "Low"}</strong>
            </div>
          </div>
        </Card>

        <Card title="Engagement Summary" description="Signals from your shared notes and study community interaction.">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5 text-sm">
              <span className="inline-flex items-center gap-2 text-[rgb(var(--text-secondary))]"><Flame className="h-4 w-4" /> Engagement score</span>
              <strong className="text-[rgb(var(--text-primary))]">{engagementScore}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5 text-sm">
              <span className="inline-flex items-center gap-2 text-[rgb(var(--text-secondary))]"><MessageSquare className="h-4 w-4" /> Comments + likes</span>
              <strong className="text-[rgb(var(--text-primary))]">{totalComments + totalLikes}</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] px-3 py-2.5 text-sm">
              <span className="inline-flex items-center gap-2 text-[rgb(var(--text-secondary))]"><Star className="h-4 w-4" /> Ratings + bookmarks</span>
              <strong className="text-[rgb(var(--text-primary))]">{totalRatings + totalBookmarks}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Performance Bars" description="Compact comparison of your core study indicators.">
        <div className="space-y-3">
          {[
            { label: "Assignment Completion", value: completionRate, tone: "from-emerald-500 to-teal-500" },
            { label: "Consistency Score", value: consistencyScore, tone: "from-blue-500 to-cyan-500" },
            { label: "Readiness Score", value: readinessScore, tone: "from-amber-500 to-orange-500" },
            { label: "Public Share Rate", value: publicShareRate, tone: "from-fuchsia-500 to-pink-500" },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[rgb(var(--text-secondary))]">{metric.label}</span>
                <strong className="text-[rgb(var(--text-primary))]">{metric.value}%</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-hover))]">
                <div className={`h-full rounded-full bg-gradient-to-r ${metric.tone}`} style={{ width: `${metric.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Student Recommendations" description="Suggested actions based on your current study metrics.">
        <ul className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
          <li>1. Keep at least 3 new notes per week to improve revision retention.</li>
          <li>2. Resolve overdue assignments first, then schedule upcoming exams in Planner.</li>
          <li>3. Share polished notes publicly to increase feedback and engagement.</li>
        </ul>
      </Card>
    </div>
  );
}
