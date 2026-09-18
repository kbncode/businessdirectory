import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { approvePromotion } from "@/lib/queries/admin-promotions";
import { sendEmail } from "@/lib/email";
import PromotionApproved from "@/emails/PromotionApproved";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const promotion = await approvePromotion(params.id);

    try {
      await sendEmail(
        promotion.submittedBy.email,
        "Your promotion is live on KBN Business Directory",
        PromotionApproved({
          title: promotion.title,
          businessName: promotion.business.businessName,
          businessSlug: promotion.business.slug,
        })
      );
    } catch (emailError) {
      console.error(`Failed to send PromotionApproved email for promotion ${promotion.id}:`, emailError);
    }

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error(`Failed to approve promotion ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to approve promotion." }, { status: 500 });
  }
}
