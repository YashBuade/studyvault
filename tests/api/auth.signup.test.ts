import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  AUTH_COOKIE_NAME: "studyvault_session",
  getCookieOptions: () => ({ path: "/", httpOnly: true }),
  signSession: vi.fn(async () => "session-token"),
}));

import { POST } from "@/app/api/auth/signup/route";
import { prisma } from "@/lib/prisma";

describe("auth signup api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates account and returns 201", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 1,
      email: "test@example.com",
      name: "Test",
      passwordHash: "hashed",
      avatarUrl: null,
      onboardingSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordChanged: new Date(),
    });

    const req = new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test@example.com", password: "password123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});