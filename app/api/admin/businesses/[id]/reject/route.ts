import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { rejectBusiness } from "@/lib/queries/admin-business";
import { sendEmail } from "@/lib/email";
import ListingRejected from "@/emails/ListingRejected";

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
    const business = await rejectBusiness(params.id, reason);

    try {
      await sendEmail(
        business.submittedBy.email,
        "An update on your KBN Business Directory submission",
        ListingRejected({ businessName: business.businessName, rejectionReason: reason })
      );
    } catch (emailError) {
      console.error(
        `Failed to send ListingRejected email for business ${business.id} to ${business.submittedBy.email}:`,
        emailError
      );
    }

    revalidatePath(`/business/${business.id}`);
    return NextResponse.json({ business });
  } catch (error) {
    console.error(`Failed to reject business ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to reject listing." }, { status: 500 });
  }
}
