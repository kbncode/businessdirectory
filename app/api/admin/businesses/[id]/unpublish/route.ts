import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { unpublishBusiness } from "@/lib/queries/admin-business";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const business = await unpublishBusiness(params.id);
    revalidatePath(`/business/${business.slug}`);
    return NextResponse.json({ business });
  } catch (error) {
    console.error(`Failed to unpublish business ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to unpublish listing." }, { status: 500 });
  }
}
