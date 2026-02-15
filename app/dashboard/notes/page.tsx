import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { PageHeader } from "@/components/dashboard/page-header";
import { NotesClient } from "@/components/dashboard/notes-client";

type NoteRecord = {
  id: number;
  title: string;
  content: string;
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
  })) as NoteRecord[];

  const initialNotes = notes.map((note) => ({
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    deletedAt: note.deletedAt ? note.deletedAt.toISOString() : null,
  }));

  return (
    <>
      <PageHeader title="Notes" description="Create, organize, and securely store notes in your personal vault." />
      <NotesClient initialNotes={initialNotes} />
    </>
  );
}
