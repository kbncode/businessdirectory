import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getLiveViewerCount } from "@/lib/queries/admin-dashboard";

export async function GET() {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const count = await getLiveViewerCount();
  return NextResponse.json({ count });
}
