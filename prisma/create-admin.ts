// One-off script to create (or reset) the seed admin account.
// Run with: npx ts-node --project prisma/tsconfig.seed.json prisma/create-admin.ts
//
// Generates a random temporary password, hashes it, and prints the plaintext
// to the console ONCE. It is never written to a file or committed anywhere —
// copy it down before it scrolls off, then log in and consider it used.

import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "kbn.gky@gmail.com";

function generateTempPassword() {
  // 16 random bytes -> base64url, trimmed to a comfortable 20-char password.
  return crypto.randomBytes(16).toString("base64url").slice(0, 20);
}

async function main() {
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash },
    create: { email: ADMIN_EMAIL, passwordHash },
  });

  console.log("Admin account ready.");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${tempPassword}`);
  console.log("Copy this password now — it will not be shown again. Log in at /admin/login.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
