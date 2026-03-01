import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function fail(message) {
  console.error(`[admin:create] ${message}`);
  process.exit(1);
}

const email = (readArg("--email") ?? "").trim().toLowerCase();
const name = (readArg("--name") ?? "").trim();
const password = (readArg("--password") ?? "").trim();
const bootstrapKey = (readArg("--bootstrap-key") ?? "").trim();
const expectedBootstrapKey = (process.env.ADMIN_BOOTSTRAP_KEY ?? "").trim();

if (!expectedBootstrapKey) {
  fail("Missing ADMIN_BOOTSTRAP_KEY in environment.");
}

if (!bootstrapKey || bootstrapKey !== expectedBootstrapKey) {
  fail("Invalid bootstrap key.");
}

if (!email || !name || !password) {
  fail("Usage: node scripts/create-admin.mjs --email <email> --name <name> --password <password> --bootstrap-key <key>");
}

if (password.length < 8) {
  fail("Password must be at least 8 characters.");
}

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        name,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.info(`[admin:create] Existing user promoted to ADMIN: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "ADMIN",
        teacherVerificationStatus: "NONE",
      },
    });
    console.info(`[admin:create] New ADMIN created: ${email}`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : "Unexpected error while creating admin.");
} finally {
  await prisma.$disconnect();
}
