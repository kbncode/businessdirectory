import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getPromotionForAdmin, updatePromotionSortOrder } from "@/lib/queries/admin-promotions";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const promotion = await getPromotionForAdmin(params.id);
  if (!promotion) {
    return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  }

  return NextResponse.json({ promotion });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !("sortOrder" in body)) {
    return NextResponse.json({ error: "sortOrder is required." }, { status: 400 });
  }

  const sortOrder = body.sortOrder === null ? null : Number(body.sortOrder);
  if (sortOrder !== null && !Number.isInteger(sortOrder)) {
    return NextResponse.json({ error: "sortOrder must be an integer or null." }, { status: 400 });
  }

  const promotion = await updatePromotionSortOrder(params.id, sortOrder);
  return NextResponse.json({ promotion });
}
