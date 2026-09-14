import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { deleteAsset } from "@/lib/blob-storage";
import { getBusinessForAdmin, deleteBusiness } from "@/lib/queries/admin-business";
import { applyBusinessEdit } from "@/lib/business-edit";

// sharp (via compressImage, inside applyBusinessEdit) needs the Node.js
// runtime — never move this route to Edge.
export const runtime = "nodejs";
// sharp compression on a large photo/brochure upload can take a while —
// give it real headroom instead of hitting the platform's default timeout.
export const maxDuration = 30;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const business = await getBusinessForAdmin(params.id);
  if (!business) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ business });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await getBusinessForAdmin(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const result = await applyBusinessEdit(existing, formData);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
  }

  revalidatePath(`/business/${result.business.slug}`);
  return NextResponse.json({ business: result.business });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await getBusinessForAdmin(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  try {
    await deleteBusiness(params.id);
  } catch (error) {
    console.error(`Failed to delete business ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to delete listing." }, { status: 500 });
  }

  if (existing.photoUrl) await deleteAsset(existing.photoUrl).catch(() => {});
  if (existing.brochureUrl) await deleteAsset(existing.brochureUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}
