import { NextResponse } from "next/server";
import { getViewerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compressImage } from "@/lib/image-compression";
import { uploadAsset } from "@/lib/blob-storage";
import { validateUploadFile } from "@/lib/file-validation";
import { verifyFileSignature } from "@/lib/file-signature";
import {
  ALLOWED_PROMOTION_IMAGE_TYPES,
  MAX_PROMOTION_IMAGE_BYTES,
  PROMOTION_IMAGE_MAX_WIDTH,
} from "@/lib/promotion-constants";
import { validatePromotionCommon, type PromotionCommonValues } from "@/lib/promotion-validation";
import { getDetailsSchema } from "@/lib/promotion-details-schema";
import { getActivePromotionForBusiness, createPromotion } from "@/lib/queries/promotions";
import { sendEmail } from "@/lib/email";
import PromotionSubmitted from "@/emails/PromotionSubmitted";

// sharp (via compressImage) needs the Node.js runtime — never move to Edge.
export const runtime = "nodejs";
export const maxDuration = 30;

const ADMIN_ALERT_EMAIL = "kbn.gky@gmail.com";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function POST(request: Request) {
  const session = await getViewerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const formData = await request.formData();

  const common: PromotionCommonValues = {
    businessId: field(formData, "businessId"),
    type: (["OFFER", "ADVERTISEMENT", "CAMPAIGN"].includes(field(formData, "type"))
      ? field(formData, "type")
      : "OFFER") as PromotionCommonValues["type"],
    title: field(formData, "title"),
    description: field(formData, "description"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
  };

  const commonErrors = validatePromotionCommon(common);
  if (Object.keys(commonErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors: commonErrors }, { status: 400 });
  }

  // Ownership + APPROVED check — never trust the client-submitted
  // businessId beyond using it to look the row up.
  const business = await prisma.business.findUnique({ where: { id: common.businessId } });
  if (!business || business.submittedById !== session.user.id || business.status !== "APPROVED") {
    return NextResponse.json({ error: "That business isn't eligible for a promotion." }, { status: 403 });
  }

  // The one-active-promotion-per-business rule, enforced here regardless of
  // what the form UI already checked client-side.
  const existingActive = await getActivePromotionForBusiness(common.businessId);
  if (existingActive) {
    return NextResponse.json(
      {
        error: `${business.businessName} already has an active promotion. You can submit a new one once it ends, is rejected, or you remove it.`,
      },
      { status: 409 }
    );
  }

  const detailsSchema = getDetailsSchema(common.type);
  const rawDetails: Record<string, unknown> = {};
  for (const key of detailsSchema.keyof().options as string[]) {
    rawDetails[key] = field(formData, key);
  }
  const detailsResult = detailsSchema.safeParse(rawDetails);
  if (!detailsResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of detailsResult.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors }, { status: 400 });
  }

  const photoFile = formData.get("image");
  let imageUrl: string | null = null;

  if (photoFile instanceof File && photoFile.size > 0) {
    const photoError = validateUploadFile(photoFile, ALLOWED_PROMOTION_IMAGE_TYPES, MAX_PROMOTION_IMAGE_BYTES);
    if (photoError) {
      return NextResponse.json({ error: photoError }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await photoFile.arrayBuffer());
    if (!verifyFileSignature(inputBuffer, photoFile.type)) {
      return NextResponse.json({ error: "Image content doesn't match its declared type." }, { status: 400 });
    }

    const compressed = await compressImage(inputBuffer, { maxWidth: PROMOTION_IMAGE_MAX_WIDTH, quality: 80 });
    const uploaded = await uploadAsset(compressed.buffer, "promotions", `${crypto.randomUUID()}.webp`, "image/webp");
    imageUrl = uploaded.url;
  }

  const promotion = await createPromotion({
    businessId: common.businessId,
    submittedById: session.user.id,
    type: common.type,
    title: common.title,
    description: common.description,
    imageUrl,
    startDate: new Date(common.startDate),
    endDate: new Date(common.endDate),
    details: detailsResult.data,
  });

  try {
    await sendEmail(
      ADMIN_ALERT_EMAIL,
      "New promotion submitted for review",
      PromotionSubmitted({ title: promotion.title, type: promotion.type, businessName: business.businessName })
    );
  } catch (error) {
    // Never block the submission on a failed notification email.
    console.error(`Failed to send PromotionSubmitted email for promotion ${promotion.id}:`, error);
  }

  return NextResponse.json({ promotion }, { status: 201 });
}
