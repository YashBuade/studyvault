import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookies();

  if (!session?.sub) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  const userId = Number(session.sub);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user,
  });
}

