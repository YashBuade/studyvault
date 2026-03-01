import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserId } from "@/lib/require-user";
import { getUserAccessProfile } from "@/lib/admin";
import { TeacherFileReviewClient } from "@/src/components/dashboard/teacher-file-review-client";

export default async function TeacherReviewPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const user = await getUserAccessProfile(userId);
  const canReview =
    user?.role === "ADMIN" || (user?.role === "TEACHER" && user.teacherVerificationStatus === "APPROVED");

  if (!canReview) {
    redirect("/dashboard/teacher");
  }

  return (
    <>
      <PageHeader
        title="File Verification Queue"
        description="Review uploaded public files to keep the shared library accurate and trustworthy."
      />
      <TeacherFileReviewClient />
    </>
  );
}
