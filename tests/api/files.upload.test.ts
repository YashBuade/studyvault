import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/require-user", () => ({
  getCurrentUserId: vi.fn(async () => 1),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    file: {
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/files/upload/route";

describe("file upload api", () => {
  it("returns 400 when file missing", async () => {
    const body = new FormData();
    const req = new Request("http://localhost/api/files/upload", {
      method: "POST",
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
