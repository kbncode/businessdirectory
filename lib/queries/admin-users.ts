import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function listAdmins() {
  return prisma.admin.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

function generateTempPassword() {
  return crypto.randomBytes(16).toString("base64url").slice(0, 20);
}

export async function createAdmin(email: string, name: string) {
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const admin = await prisma.admin.create({
    data: { email: email.toLowerCase(), name: name || null, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return { admin, tempPassword };
}

export async function deleteAdmin(id: string) {
  await prisma.admin.delete({ where: { id } });
}
