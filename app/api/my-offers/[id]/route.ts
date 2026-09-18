import { NextResponse } from "next/server";
import { getViewerSession } from "@/lib/auth";
import { removeMyPromotion } from "@/lib/queries/promotions";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getViewerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.status !== "REMOVED") {
    return NextResponse.json({ error: 'Only { status: "REMOVED" } is supported here.' }, { status: 400 });
  }

  const result = await removeMyPromotion(params.id, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Unable to remove this promotion." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
