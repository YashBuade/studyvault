import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function parseDatabaseUrl() {
  const fallback = "mysql://root:2005@127.0.0.1:3306/studyvault";
  const rawUrl = process.env.DATABASE_URL || fallback;
  const parsed = new URL(rawUrl);

  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 3306;
  const user = decodeURIComponent(parsed.username || "root");
  const password = decodeURIComponent(parsed.password || "");
  const database = parsed.pathname.replace(/^\//, "") || "studyvault";

  const connectionLimit = Number(parsed.searchParams.get("connection_limit") ?? "10");
  const acquireTimeout = Number(parsed.searchParams.get("pool_timeout") ?? "60000");
  const connectTimeout = Number(parsed.searchParams.get("connect_timeout") ?? "15000");

  return {
    rawUrl,
    host,
    port,
    user,
    password,
    database,
    connectionLimit,
    acquireTimeout,
    connectTimeout,
  };
}

function createPrismaClient() {
  const config = parseDatabaseUrl();
  console.log("[Prisma] Initializing database connection...");
  console.log("[Prisma] Connection string:", config.rawUrl.replace(/:[^:]*@/, ":****@"));

  const adapter = new PrismaMariaDb({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    acquireTimeout: config.acquireTimeout,
    connectTimeout: config.connectTimeout,
  });

  const client = new PrismaClient({
    adapter,
    log: [
      { emit: "stdout", level: "error" },
      { emit: "stdout", level: "warn" },
    ],
  });

  client
    .$connect()
    .then(() => console.log("[Prisma] Database connection established"))
    .catch((err) => console.error("[Prisma] Database connection failed:", err.message));

  return client;
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
