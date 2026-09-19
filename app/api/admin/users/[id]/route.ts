import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { deleteAsset } from "@/lib/blob-storage";
import { getViewerUserForAdmin, deleteViewerUser } from "@/lib/queries/viewer-users";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await getViewerUserForAdmin(params.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// An admin editing another viewer's account — name and/or a new password,
// set directly with no current-password check (the admin's own session is
// the authorization here; contrast with PATCH /api/profile/password, where
// a viewer changing their *own* password still has to prove they know the
// current one).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawName = body?.name;
  const rawPassword = body?.newPassword;
  const name = typeof rawName === "string" ? rawName.trim() : undefined;
  const newPassword = typeof rawPassword === "string" ? rawPassword : "";

  if (newPassword && newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const data: { name?: string | null; passwordHash?: string } = {};
  if (name !== undefined) data.name = name || null;
  if (newPassword) data.passwordHash = await hashPassword(newPassword);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const result = await deleteViewerUser(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Unable to delete this user." }, { status: 409 });
  }

  await Promise.all(result.deletedAssetUrls.map((url) => deleteAsset(url).catch(() => {})));

  return NextResponse.json({ ok: true });
}
