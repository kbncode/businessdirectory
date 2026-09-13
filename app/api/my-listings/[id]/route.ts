import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getViewerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyBusinessEdit } from "@/lib/business-edit";

// sharp (via compressImage, inside applyBusinessEdit) needs the Node.js
// runtime — never move this route to Edge.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getViewerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to edit a listing." }, { status: 401 });
  }

  const existing = await prisma.business.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (existing.submittedById !== session.user.id) {
    return NextResponse.json({ error: "You can only edit your own listings." }, { status: 403 });
  }

  const formData = await request.formData();
  const result = await applyBusinessEdit(existing, formData);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
  }

  // Edits apply immediately regardless of status — an already-APPROVED
  // listing stays live without going back through admin review.
  revalidatePath(`/business/${result.business.id}`);
  return NextResponse.json({ business: result.business });
}
