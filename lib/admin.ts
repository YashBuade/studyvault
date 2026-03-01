import { prisma } from "@/lib/prisma";

export async function isAdminUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function getUserAccessProfile(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      teacherVerificationStatus: true,
    },
  });
}

export async function isVerifiedTeacherUser(userId: number) {
  const user = await getUserAccessProfile(userId);
  return user?.role === "TEACHER" && user.teacherVerificationStatus === "APPROVED";
}
