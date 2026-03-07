import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { failure, success } from "@/lib/api/response";
import { logError } from "@/lib/api/logger";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_WINDOW_MINUTES = 15;

type ActivityBucket = {
  date: string;
  label: string;
  newUsers: number;
  newNotes: number;
  newFiles: number;
  totalActivity: number;
};

type ActiveSignal = {
  userId: number;
  at: Date;
  source: string;
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function labelForDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(failure("UNAUTHORIZED", "Unauthorized"), { status: 401 });
    }
    if (!(await isAdminUser(userId))) {
      return NextResponse.json(failure("FORBIDDEN", "Admin only"), { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 6 * DAY_MS);
    const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MINUTES * 60 * 1000);

    const [
      totalUsers,
      totalTeachers,
      totalNotes,
      publicNotes,
      privateNotes,
      totalResources,
      totalAssignments,
      totalExams,
      notesUploadedLastWeek,
      storageAggregate,
      recentUsers,
      recentNotes,
      noteCountsByUser,
      fileCountsByUser,
      resourceCountsByUser,
      assignmentCountsByUser,
      examCountsByUser,
      publicNotesForEngagement,
      usersLastWeek,
      notesLastWeek,
      filesLastWeek,
      notesActiveSignals,
      filesActiveSignals,
      resourcesActiveSignals,
      assignmentsActiveSignals,
      examsActiveSignals,
      commentsActiveSignals,
      likesActiveSignals,
      bookmarksActiveSignals,
      ratingsActiveSignals,
      sharesActiveSignals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.note.count({ where: { deletedAt: null } }),
      prisma.note.count({ where: { deletedAt: null, isPublic: true } }),
      prisma.note.count({ where: { deletedAt: null, isPublic: false } }),
      prisma.resourceItem.count(),
      prisma.assignment.count(),
      prisma.exam.count(),
      prisma.note.count({ where: { deletedAt: null, createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } } }),
      prisma.file.aggregate({
        where: { deletedAt: null },
        _sum: { size: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.note.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          isPublic: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.note.groupBy({
        by: ["userId"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.file.groupBy({
        by: ["userId"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.resourceItem.groupBy({
        by: ["userId"],
        _count: { _all: true },
      }),
      prisma.assignment.groupBy({
        by: ["userId"],
        _count: { _all: true },
      }),
      prisma.exam.groupBy({
        by: ["userId"],
        _count: { _all: true },
      }),
      prisma.note.findMany({
        where: { deletedAt: null, isPublic: true },
        take: 80,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
              shares: true,
              attachments: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.note.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null },
        select: { createdAt: true },
      }),
      prisma.file.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null },
        select: { createdAt: true },
      }),
      prisma.note.findMany({
        where: {
          deletedAt: null,
          OR: [{ createdAt: { gte: activeSince } }, { updatedAt: { gte: activeSince } }],
        },
        select: { userId: true, createdAt: true, updatedAt: true },
        take: 300,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.file.findMany({
        where: { deletedAt: null, createdAt: { gte: activeSince } },
        select: { userId: true, createdAt: true },
        take: 300,
        orderBy: { createdAt: "desc" },
      }),
      prisma.resourceItem.findMany({
        where: {
          OR: [{ createdAt: { gte: activeSince } }, { updatedAt: { gte: activeSince } }],
        },
        select: { userId: true, createdAt: true, updatedAt: true },
        take: 300,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.assignment.findMany({
        where: {
          OR: [{ createdAt: { gte: activeSince } }, { updatedAt: { gte: activeSince } }],
        },
        select: { userId: true, createdAt: true, updatedAt: true },
        take: 300,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.exam.findMany({
        where: {
          OR: [{ createdAt: { gte: activeSince } }, { updatedAt: { gte: activeSince } }],
        },
        select: { userId: true, createdAt: true, updatedAt: true },
        take: 300,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.noteComment.findMany({
        where: { createdAt: { gte: activeSince } },
        select: { userId: true, createdAt: true },
        take: 300,
        orderBy: { createdAt: "desc" },
      }),
      prisma.noteLike.findMany({
        where: { createdAt: { gte: activeSince } },
        select: { userId: true, createdAt: true },
        take: 300,
        orderBy: { createdAt: "desc" },
      }),
      prisma.noteBookmark.findMany({
        where: { createdAt: { gte: activeSince } },
        select: { userId: true, createdAt: true },
        take: 300,
        orderBy: { createdAt: "desc" },
      }),
      prisma.noteRating.findMany({
        where: { createdAt: { gte: activeSince } },
        select: { userId: true, createdAt: true },
        take: 300,
        orderBy: { createdAt: "desc" },
      }),
      prisma.noteShare.findMany({
        where: { createdAt: { gte: activeSince } },
        select: { creatorId: true, createdAt: true },
        take: 300,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const activityByUser = new Map<
      number,
      { notes: number; files: number; resources: number; assignments: number; exams: number; score: number }
    >();

    const mergeCount = (userIdValue: number, key: "notes" | "files" | "resources" | "assignments" | "exams", count: number) => {
      const current =
        activityByUser.get(userIdValue) ?? { notes: 0, files: 0, resources: 0, assignments: 0, exams: 0, score: 0 };
      current[key] = count;
      current.score = current.notes + current.files + current.resources + current.assignments + current.exams;
      activityByUser.set(userIdValue, current);
    };

    for (const row of noteCountsByUser) mergeCount(row.userId, "notes", row._count._all);
    for (const row of fileCountsByUser) mergeCount(row.userId, "files", row._count._all);
    for (const row of resourceCountsByUser) mergeCount(row.userId, "resources", row._count._all);
    for (const row of assignmentCountsByUser) mergeCount(row.userId, "assignments", row._count._all);
    for (const row of examCountsByUser) mergeCount(row.userId, "exams", row._count._all);

    const topActiveUserIds = [...activityByUser.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5)
      .map(([id]) => id);

    const activeUsers = topActiveUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: topActiveUserIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];

    const activeUserMap = new Map(activeUsers.map((user) => [user.id, user]));
    const mostActiveUsers = topActiveUserIds
      .map((id) => {
        const profile = activeUserMap.get(id);
        const metrics = activityByUser.get(id);
        if (!profile || !metrics) return null;
        return {
          id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          score: metrics.score,
          notes: metrics.notes,
          files: metrics.files,
          resources: metrics.resources,
          assignments: metrics.assignments,
          exams: metrics.exams,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const mostDownloadedNotes = publicNotesForEngagement
      .map((note) => {
        const engagementScore =
          note._count.likes + note._count.comments + note._count.bookmarks + note._count.shares + note._count.attachments;
        return {
          id: note.id,
          title: note.title,
          authorName: note.user.name,
          createdAt: note.createdAt,
          engagementScore,
          likes: note._count.likes,
          comments: note._count.comments,
          bookmarks: note._count.bookmarks,
          shares: note._count.shares,
          attachments: note._count.attachments,
        };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5);

    const activeSignals: ActiveSignal[] = [
      ...notesActiveSignals.map((item) => ({ userId: item.userId, at: item.updatedAt > item.createdAt ? item.updatedAt : item.createdAt, source: "notes" })),
      ...filesActiveSignals.map((item) => ({ userId: item.userId, at: item.createdAt, source: "files" })),
      ...resourcesActiveSignals.map((item) => ({ userId: item.userId, at: item.updatedAt > item.createdAt ? item.updatedAt : item.createdAt, source: "resources" })),
      ...assignmentsActiveSignals.map((item) => ({ userId: item.userId, at: item.updatedAt > item.createdAt ? item.updatedAt : item.createdAt, source: "assignments" })),
      ...examsActiveSignals.map((item) => ({ userId: item.userId, at: item.updatedAt > item.createdAt ? item.updatedAt : item.createdAt, source: "exams" })),
      ...commentsActiveSignals.map((item) => ({ userId: item.userId, at: item.createdAt, source: "comments" })),
      ...likesActiveSignals.map((item) => ({ userId: item.userId, at: item.createdAt, source: "likes" })),
      ...bookmarksActiveSignals.map((item) => ({ userId: item.userId, at: item.createdAt, source: "bookmarks" })),
      ...ratingsActiveSignals.map((item) => ({ userId: item.userId, at: item.createdAt, source: "ratings" })),
      ...sharesActiveSignals.map((item) => ({ userId: item.creatorId, at: item.createdAt, source: "shares" })),
    ].filter((item) => item.at >= activeSince);

    const activeByUser = new Map<number, { lastActivityAt: Date; sourceSet: Set<string>; actions: number }>();
    for (const signal of activeSignals) {
      const current = activeByUser.get(signal.userId);
      if (!current) {
        activeByUser.set(signal.userId, { lastActivityAt: signal.at, sourceSet: new Set([signal.source]), actions: 1 });
      } else {
        current.actions += 1;
        current.sourceSet.add(signal.source);
        if (signal.at > current.lastActivityAt) current.lastActivityAt = signal.at;
      }
    }

    const currentlyActiveUserIds = [...activeByUser.keys()].slice(0, 25);
    const currentlyActiveProfiles = currentlyActiveUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: currentlyActiveUserIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];
    const activeProfileMap = new Map(currentlyActiveProfiles.map((user) => [user.id, user]));
    const currentlyActiveUsers = currentlyActiveUserIds
      .map((id) => {
        const activity = activeByUser.get(id);
        const profile = activeProfileMap.get(id);
        if (!activity || !profile) return null;
        return {
          id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          lastActivityAt: activity.lastActivityAt.toISOString(),
          actionCount: activity.actions,
          activeSources: [...activity.sourceSet],
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
      .slice(0, 8);

    const buckets: ActivityBucket[] = [];
    const bucketMap = new Map<string, ActivityBucket>();
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * DAY_MS);
      const key = dateKey(date);
      const bucket: ActivityBucket = {
        date: key,
        label: labelForDate(date),
        newUsers: 0,
        newNotes: 0,
        newFiles: 0,
        totalActivity: 0,
      };
      buckets.push(bucket);
      bucketMap.set(key, bucket);
    }

    for (const row of usersLastWeek) {
      const bucket = bucketMap.get(dateKey(row.createdAt));
      if (bucket) bucket.newUsers += 1;
    }
    for (const row of notesLastWeek) {
      const bucket = bucketMap.get(dateKey(row.createdAt));
      if (bucket) bucket.newNotes += 1;
    }
    for (const row of filesLastWeek) {
      const bucket = bucketMap.get(dateKey(row.createdAt));
      if (bucket) bucket.newFiles += 1;
    }
    for (const bucket of buckets) {
      bucket.totalActivity = bucket.newUsers + bucket.newNotes + bucket.newFiles;
    }

    return NextResponse.json(
      success({
        totalUsers,
        totalTeachers,
        totalNotes,
        publicNotes,
        privateNotes,
        totalResources,
        totalAssignments,
        totalExams,
        totalStorageUsedBytes: storageAggregate._sum.size ?? 0,
        recentUsers,
        recentNotes,
        mostActiveUsers,
        mostDownloadedNotes,
        notesUploadedLastWeek,
        activityLast7Days: buckets,
        currentlyActiveUsers,
        currentlyActiveCount: currentlyActiveUsers.length,
        activityWindowMinutes: ACTIVE_WINDOW_MINUTES,
        generatedAt: now.toISOString(),
        mostDownloadedNotesMetric: "engagement_proxy",
      }),
    );
  } catch (error) {
    logError("admin.analytics_get_failed", error);
    return NextResponse.json(failure("INTERNAL_ERROR", "Unable to fetch analytics"), { status: 503 });
  }
}
