import { NextResponse } from "next/server";
import type { BusinessStatus } from "@prisma/client";
import { getAdminSession } from "@/lib/auth";
import { getAllBusinessesForAdmin } from "@/lib/queries/admin-business";

// Backs "Load more" cursor pagination on /admin/listings.
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") as BusinessStatus | null) || undefined;
  const q = url.searchParams.get("q") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;

  const page = await getAllBusinessesForAdmin({ status, q }, cursor);
  return NextResponse.json(page);
}
