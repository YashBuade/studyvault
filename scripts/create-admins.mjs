import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function fail(message) {
  console.error(`[admin:create:many] ${message}`);
  process.exit(1);
}

function parseAdmins(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const adminsRaw = (readArg("--admins-json") ?? "").trim();
const bootstrapKey = (readArg("--bootstrap-key") ?? "").trim();
const expectedBootstrapKey = (process.env.ADMIN_BOOTSTRAP_KEY ?? "").trim();

if (!expectedBootstrapKey) {
  fail("Missing ADMIN_BOOTSTRAP_KEY in environment.");
}

if (!bootstrapKey || bootstrapKey !== expectedBootstrapKey) {
  fail("Invalid bootstrap key.");
}

if (!adminsRaw) {
  fail(
    "Usage: node scripts/create-admins.mjs --admins-json '[{\"email\":\"a@x.com\",\"name\":\"A\",\"password\":\"Strong123\"}]' --bootstrap-key <key>",
  );
}

const admins = parseAdmins(adminsRaw);
if (!admins || admins.length === 0) {
  fail("admins-json must be a non-empty JSON array.");
}

const normalized = admins.map((item, idx) => {
  const email = String(item?.email ?? "").trim().toLowerCase();
  const name = String(item?.name ?? "").trim();
  const password = String(item?.password ?? "").trim();

  if (!email || !name || !password) {
    fail(`Invalid admin entry at index ${idx}. Required: email, name, password.`);
  }

  if (password.length < 8) {
    fail(`Password too short for ${email}. Minimum 8 characters.`);
  }

  return { email, name, password };
});

const prisma = new PrismaClient();

try {
  for (const admin of normalized) {
    const passwordHash = await bcrypt.hash(admin.password, 12);
    const existing = await prisma.user.findUnique({ where: { email: admin.email } });

    if (existing) {
      await prisma.user.update({
        where: { email: admin.email },
        data: {
          name: admin.name,
          passwordHash,
          role: "ADMIN",
        },
      });
      console.info(`[admin:create:many] Existing user promoted to ADMIN: ${admin.email}`);
    } else {
      await prisma.user.create({
        data: {
          email: admin.email,
          name: admin.name,
          passwordHash,
          role: "ADMIN",
          teacherVerificationStatus: "NONE",
        },
      });
      console.info(`[admin:create:many] New ADMIN created: ${admin.email}`);
    }
  }
} catch (error) {
  fail(error instanceof Error ? error.message : "Unexpected error while creating admins.");
} finally {
  await prisma.$disconnect();
}
