import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");
// Match Next.js-style precedence: load `.env` first, then let `.env.local` override.
dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer the direct URL for schema changes (migrate/db push). Fall back to pooled if needed.
    url: env("DIRECT_URL") || env("DATABASE_URL") || process.env.DATABASE_URL,
  },
});
