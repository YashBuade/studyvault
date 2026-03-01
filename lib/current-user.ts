import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { logError } from "@/lib/api/logger";

export async function getCurrentUser() {
  const session = await getSessionFromCookies();

  if (!session?.sub) {
    return null;
  }

  const userId = Number(session.sub);

  if (Number.isNaN(userId)) {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        onboardingSeen: true,
        role: true,
        collegeId: true,
        department: true,
        teacherVerificationStatus: true,
        teacherReviewNotes: true,
        teacherVerifiedAt: true,
      },
    });
  } catch (error) {
    logError("auth.current_user_lookup_failed", error, { userId });
    return null;
  }
}
