import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getPromotionForAdmin, removePromotionAsAdmin } from "@/lib/queries/admin-promotions";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await getPromotionForAdmin(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  }

  const promotion = await removePromotionAsAdmin(params.id);
  return NextResponse.json({ promotion });
}
