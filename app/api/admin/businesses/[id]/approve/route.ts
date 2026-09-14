import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { approveBusiness } from "@/lib/queries/admin-business";
import { sendEmail } from "@/lib/email";
import ListingApproved from "@/emails/ListingApproved";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const business = await approveBusiness(params.id);

    try {
      await sendEmail(
        business.submittedBy.email,
        "Your listing is live on KBN Business Directory",
        ListingApproved({ businessName: business.businessName, businessSlug: business.slug })
      );
    } catch (emailError) {
      console.error(
        `Failed to send ListingApproved email for business ${business.id} to ${business.submittedBy.email}:`,
        emailError
      );
    }

    revalidatePath(`/business/${business.slug}`);
    return NextResponse.json({ business });
  } catch (error) {
    console.error(`Failed to approve business ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to approve listing." }, { status: 500 });
  }
}
