import { NextResponse } from "next/server";
import type { PromotionStatus } from "@prisma/client";
import { getAdminSession } from "@/lib/auth";
import { getAllPromotionsForAdmin } from "@/lib/queries/admin-promotions";

// Backs "Load more" cursor pagination on /admin/promotions.
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status = (statusParam as PromotionStatus | "EXPIRED" | null) || undefined;
  const q = url.searchParams.get("q") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;

  const page = await getAllPromotionsForAdmin({ status, q }, cursor);
  return NextResponse.json(page);
}
