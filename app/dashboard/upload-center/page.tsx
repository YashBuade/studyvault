import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/require-user";
import { PageHeader } from "@/components/dashboard/page-header";
import { UploadCenterClient } from "@/components/dashboard/upload-center-client";

type UploadRecord = {
  id: number;
  originalName: string;
  size: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationNotes: string | null;
  verifiedAt: Date | null;
  verifiedBy: { id: number; name: string; email: string } | null;
  deletedAt: Date | null;
};

export default async function UploadCenterPage() {
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
  })) as UploadRecord[];

  const initialFiles = files.map((file) => ({
    ...file,
    verifiedAt: file.verifiedAt ? file.verifiedAt.toISOString() : null,
    deletedAt: file.deletedAt ? file.deletedAt.toISOString() : null,
  }));

  return (
    <>
      <PageHeader
        title="Upload Center"
        description="Upload study files securely and keep a searchable archive for every subject."
      />
      <UploadCenterClient initialFiles={initialFiles} />
    </>
  );
}
