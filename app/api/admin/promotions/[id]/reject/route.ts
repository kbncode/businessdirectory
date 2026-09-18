import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { rejectPromotion } from "@/lib/queries/admin-promotions";
import { sendEmail } from "@/lib/email";
import PromotionRejected from "@/emails/PromotionRejected";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!reason) {
    return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
  }

  try {
    const promotion = await rejectPromotion(params.id, reason);

    try {
      await sendEmail(
        promotion.submittedBy.email,
        "An update on your KBN Business Directory promotion",
        PromotionRejected({ title: promotion.title, businessName: promotion.business.businessName, rejectionReason: reason })
      );
    } catch (emailError) {
      console.error(`Failed to send PromotionRejected email for promotion ${promotion.id}:`, emailError);
    }

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error(`Failed to reject promotion ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to reject promotion." }, { status: 500 });
  }
}
