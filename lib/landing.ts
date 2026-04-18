import "server-only";

import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-safe";

export type LandingNotePreview = {
  id: number;
  title: string;
  slug: string;
  subject: string | null;
  tags: string | null;
  createdAt: Date;
  user: {
    name: string;
    role: "USER" | "TEACHER" | "ADMIN";
    teacherVerificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  };
  _count: {
    likes: number;
    comments: number;
  };
};

export type LandingSnapshot = {
  generatedAt: Date;
  stats: {
    publicNotes: number;
    newPublicNotesThisWeek: number;
    verifiedTeachers: number;
    verifiedPublicFiles: number;
  };
  latestNotes: LandingNotePreview[];
};

export async function getLandingSnapshot(): Promise<LandingSnapshot> {
  const generatedAt = new Date();
  const weekAgo = new Date(generatedAt.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      publicNotes,
      newPublicNotesThisWeek,
      verifiedTeachers,
      verifiedPublicFiles,
      latestNotes,
    ] = await withDbRetry(() =>
      prisma.$transaction([
        prisma.note.count({
          where: { isPublic: true, deletedAt: null, slug: { not: null } },
        }),
        prisma.note.count({
          where: { isPublic: true, deletedAt: null, slug: { not: null }, createdAt: { gte: weekAgo } },
        }),
        prisma.user.count({
          where: { role: "TEACHER", teacherVerificationStatus: "APPROVED" },
        }),
        prisma.file.count({
          where: {
            isPublic: true,
            deletedAt: null,
            verificationStatus: "VERIFIED",
          },
        }),
        prisma.note.findMany({
          where: { isPublic: true, deletedAt: null, slug: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            slug: true,
            subject: true,
            tags: true,
            createdAt: true,
            user: { select: { name: true, role: true, teacherVerificationStatus: true } },
            _count: { select: { likes: true, comments: true } },
          },
        }),
      ]),
    );

    return {
      generatedAt,
      stats: {
        publicNotes,
        newPublicNotesThisWeek,
        verifiedTeachers,
        verifiedPublicFiles,
      },
      latestNotes: latestNotes.map((note) => ({ ...note, slug: note.slug ?? "" })),
    };
  } catch {
    return {
      generatedAt,
      stats: {
        publicNotes: 0,
        newPublicNotesThisWeek: 0,
        verifiedTeachers: 0,
        verifiedPublicFiles: 0,
      },
      latestNotes: [],
    };
  }
}

