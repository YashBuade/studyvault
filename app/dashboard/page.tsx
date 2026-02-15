import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const [notesCount, filesCount, assignmentsCount, examsCount] = await Promise.all([
    prisma.note.count({ where: { userId, deletedAt: null } }),
    prisma.file.count({ where: { userId, deletedAt: null } }),
    prisma.assignment.count({ where: { userId } }),
    prisma.exam.count({ where: { userId } }),
  ]);

  const recentNotes = await prisma.note.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, title: true },
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A clear view of your study workflow, deadlines, and content at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-[var(--muted)]">Active Notes</p>
          <p className="mt-2 text-2xl font-semibold">{notesCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Stored Files</p>
          <p className="mt-2 text-2xl font-semibold">{filesCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Assignments</p>
          <p className="mt-2 text-2xl font-semibold">{assignmentsCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Upcoming Exams</p>
          <p className="mt-2 text-2xl font-semibold">{examsCount}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Recent Notes" description="Jump back into your latest work.">
          {recentNotes.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No notes yet. Start by creating one.</p>
          ) : (
            <div className="space-y-2">
              {recentNotes.map((note) => (
                <div key={note.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <p className="text-sm font-medium">{note.title}</p>
                  <Badge variant="info">Note</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Workspace Status" description="Quick indicators for the week.">
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-sm font-semibold">Planner Health</p>
              <p className="text-xs text-[var(--muted)]">Balance workload across categories for focus.</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-sm font-semibold">Next Deadline</p>
              <p className="text-xs text-[var(--muted)]">Track assignments and exams here.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}