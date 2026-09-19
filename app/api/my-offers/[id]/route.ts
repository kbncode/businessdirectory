import { NextResponse } from "next/server";
import { getViewerSession } from "@/lib/auth";
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
import { isActivePromotion } from "@/lib/promotion-status";
import { getMyPromotionById, removeMyPromotion, updateMyPromotion } from "@/lib/queries/promotions";

// sharp (via compressImage) needs the Node.js runtime — never move to Edge.
export const runtime = "nodejs";
export const maxDuration = 30;

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

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

// Edits a promotion's own fields — never its business or type, which stay
// fixed for the promotion's lifetime (same reasoning as the create flow's
// one-active-promotion-per-business rule: switching either here would need
// re-running that check from scratch). Publishes immediately, whatever the
// current status, matching the business listing edit convention.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getViewerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const existing = await getMyPromotionById(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  }
  if (!isActivePromotion(existing)) {
    return NextResponse.json({ error: "This offer can no longer be edited." }, { status: 409 });
  }

  const formData = await request.formData();

  const common: PromotionCommonValues = {
    businessId: existing.businessId,
    type: existing.type,
    title: field(formData, "title"),
    description: field(formData, "description"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
  };

  const commonErrors = validatePromotionCommon(common);
  if (Object.keys(commonErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors: commonErrors }, { status: 400 });
  }

  const detailsSchema = getDetailsSchema(existing.type);
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

  let imageUrl = existing.imageUrl;
  const photoFile = formData.get("image");
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
  } else if (field(formData, "removeImage") === "true") {
    imageUrl = null;
  }

  const promotion = await updateMyPromotion(existing.id, {
    title: common.title,
    description: common.description,
    imageUrl,
    startDate: new Date(common.startDate),
    endDate: new Date(common.endDate),
    details: detailsResult.data,
  });

  return NextResponse.json({ promotion });
}
