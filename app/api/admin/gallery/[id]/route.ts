import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteAsset } from "@/lib/blob-storage";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || (typeof body.isActive !== "boolean" && typeof body.caption !== "string")) {
    return NextResponse.json({ error: "isActive (boolean) and/or caption (string) is required." }, { status: 400 });
  }

  const data: { isActive?: boolean; caption?: string | null } = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.caption === "string") data.caption = body.caption.trim() || null;

  const galleryImage = await prisma.galleryImage.update({ where: { id: params.id }, data });

  return NextResponse.json({ galleryImage });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const galleryImage = await prisma.galleryImage.findUnique({ where: { id: params.id } });
  if (!galleryImage) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.galleryImage.delete({ where: { id: params.id } });

  try {
    await deleteAsset(galleryImage.imageUrl);
  } catch (error) {
    // The DB row is already gone — a failed asset delete just leaves an
    // orphaned file in storage, not a broken app state. Log and move on.
    console.error(`Failed to delete stored file for gallery image ${params.id}:`, error);
  }

  return NextResponse.json({ ok: true });
}
