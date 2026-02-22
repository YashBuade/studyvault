import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { PageHeader } from "@/components/dashboard/page-header";
import { NotesClient } from "@/components/dashboard/notes-client";

type NoteRecord = {
  id: number;
  title: string;
  content: string;
  subject: string | null;
  semester: string | null;
  tags: string | null;
  isPublic: boolean;
  slug: string | null;
  attachments: { file: { id: number; originalName: string } }[];
  createdAt: Date;
  deletedAt: Date | null;
};

export default async function NotesPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const notes = (await prisma.note.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      content: true,
      subject: true,
      semester: true,
      tags: true,
      isPublic: true,
      slug: true,
      createdAt: true,
      deletedAt: true,
      attachments: {
        select: {
          file: {
            select: { id: true, originalName: true },
          },
        },
      },
    },
  })) as NoteRecord[];

  const initialNotes = notes.map((note) => ({
    id: note.id,
    title: note.title,
    content: note.content,
    subject: note.subject,
    semester: note.semester,
    tags: note.tags,
    isPublic: note.isPublic,
    slug: note.slug,
    createdAt: note.createdAt.toISOString(),
    deletedAt: note.deletedAt ? note.deletedAt.toISOString() : null,
  }));

  return (
    <>
      <PageHeader
        title="Notes"
        description="Create, organize, and securely store notes in your personal vault."
        insight={
          notes.length > 0
            ? `You have ${notes.length} recent note${notes.length > 1 ? "s" : ""}. Keep publishing concise revision summaries weekly.`
            : "Start with one master note per subject and update it after each class."
        }
      />
      <NotesClient initialNotes={initialNotes} />
    </>
  );
}
