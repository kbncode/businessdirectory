import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
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
