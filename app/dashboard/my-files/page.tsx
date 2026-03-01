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
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationNotes: string | null;
  verifiedAt: Date | null;
  verifiedBy: { id: number; name: string; email: string } | null;
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
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      size: true,
      verificationStatus: true,
      verificationNotes: true,
      verifiedAt: true,
      verifiedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      deletedAt: true,
    },
  })) as FileRecord[];

  const initialFiles = files.map((file) => ({
    ...file,
    verifiedAt: file.verifiedAt ? file.verifiedAt.toISOString() : null,
    deletedAt: file.deletedAt ? file.deletedAt.toISOString() : null,
  }));

  return (
    <>
      <PageHeader
        title="My Files"
        description="Browse and download your uploaded documents, slides, and study assets."
        insight={
          files.length > 0
            ? `You have ${files.length} recent file${files.length > 1 ? "s" : ""}. Group them by subject for faster revision retrieval.`
            : "Upload your syllabus and core PDFs first to build your semester knowledge base."
        }
      />
      <FilesBrowserClient initialFiles={initialFiles} />
    </>
  );
}
