import { getSessionFromCookies } from "@/lib/auth";

export async function getCurrentUserId() {
  const session = await getSessionFromCookies();

  if (!session?.sub) {
    return null;
  }

  const userId = Number(session.sub);
  return Number.isNaN(userId) ? null : userId;
}