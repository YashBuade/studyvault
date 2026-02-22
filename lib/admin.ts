import { prisma } from "@/lib/prisma";

export async function isAdminUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}
