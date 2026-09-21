import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { setCityFeatured } from "@/lib/queries/admin-home-cities";

export async function PATCH(request: Request, { params }: { params: { cityId: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.featured !== "boolean") {
    return NextResponse.json({ error: "featured (boolean) is required." }, { status: 400 });
  }

  const feature = await setCityFeatured(params.cityId, body.featured);
  return NextResponse.json({ feature });
}
