import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword) {
    return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "New password must be different from your current password." }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { id: session.user.id } });
  if (!admin) {
    return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
  }

  const isCorrect = await verifyPassword(currentPassword, admin.passwordHash);
  if (!isCorrect) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
