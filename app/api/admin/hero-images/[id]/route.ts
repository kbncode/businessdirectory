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
  if (!body || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive (boolean) is required." }, { status: 400 });
  }

  const heroImage = await prisma.heroImage.update({
    where: { id: params.id },
    data: { isActive: body.isActive },
  });

  return NextResponse.json({ heroImage });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const heroImage = await prisma.heroImage.findUnique({ where: { id: params.id } });
  if (!heroImage) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.heroImage.delete({ where: { id: params.id } });

  try {
    await deleteAsset(heroImage.imageUrl);
  } catch (error) {
    // The DB row is already gone — a failed asset delete just leaves an
    // orphaned file in storage, not a broken app state. Log and move on.
    console.error(`Failed to delete stored file for hero image ${params.id}:`, error);
  }

  return NextResponse.json({ ok: true });
}
