import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getViewerUsersForAdmin } from "@/lib/queries/viewer-users";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || undefined;

  const page = await getViewerUsersForAdmin(cursor);
  return NextResponse.json(page);
}
