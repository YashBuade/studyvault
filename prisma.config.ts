import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer pooled URL by default to avoid local/network DNS blocks on direct hosts.
    // Use DIRECT_URL only if DATABASE_URL is not set.
    url: env("DATABASE_URL") || process.env.DIRECT_URL,
  },
});
