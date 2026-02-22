import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getSessionFromCookies();

  if (!session?.sub) {
    return null;
  }

  const userId = Number(session.sub);

  if (Number.isNaN(userId)) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
      onboardingSeen: true,
      role: true,
    },
  });
}
