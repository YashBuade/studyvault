import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/require-user", () => ({
  getCurrentUserId: vi.fn(async () => null),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/notes/route";

describe("notes api", () => {
  it("returns unauthorized when session missing", async () => {
    const res = await GET(new Request("http://localhost/api/notes"));
    expect(res.status).toBe(401);
  });
});
