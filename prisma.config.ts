import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer direct URL for migrations; fallback to pooled URL if direct is unavailable.
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
