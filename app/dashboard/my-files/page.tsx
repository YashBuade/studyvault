import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilesBrowserClient } from "@/components/dashboard/files-browser-client";

type FileRecord = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  deletedAt: Date | null;
};

export default async function MyFilesPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const files = (await prisma.file.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
  })) as FileRecord[];

  const initialFiles = files.map((file) => ({
    ...file,
    deletedAt: file.deletedAt ? file.deletedAt.toISOString() : null,
  }));

  return (
    <>
      <PageHeader title="My Files" description="Browse and download your uploaded documents, slides, and study assets." />
      <FilesBrowserClient initialFiles={initialFiles} />
    </>
  );
}