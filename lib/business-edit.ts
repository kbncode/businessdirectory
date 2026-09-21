import path from "path";
import { prisma } from "@/lib/prisma";
import { compressImage } from "@/lib/image-compression";
import { uploadAsset, deleteAsset } from "@/lib/blob-storage";
import { validateUploadFile } from "@/lib/file-validation";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, BUSINESS_PHOTO_MAX_WIDTH } from "@/lib/upload-constants";
import { validateBusinessForm, type BusinessFormValues } from "@/lib/business-form-validation";
import { verifyFileSignature } from "@/lib/file-signature";

// Shared by the admin edit route and the owner (my-listings) edit route —
// both apply the exact same field updates and never touch status/
// rejectionReason, so an edit to an already-APPROVED listing stays live
// immediately instead of being sent back through the pending queue.

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export interface ExistingBusinessForEdit {
  id: string;
  photoUrl: string | null;
  brochureUrl: string | null;
}

export type BusinessEditResult =
  | { ok: true; business: Awaited<ReturnType<typeof prisma.business.update>> }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };

export async function applyBusinessEdit(
  existing: ExistingBusinessForEdit,
  formData: FormData
): Promise<BusinessEditResult> {
  const values: BusinessFormValues = {
    ownerName: field(formData, "ownerName"),
    businessName: field(formData, "businessName"),
    establishedYear: field(formData, "establishedYear"),
    entityId: field(formData, "entityId"),
    typeId: field(formData, "typeId"),
    businessPhone: field(formData, "businessPhone"),
    personalPhone: field(formData, "personalPhone"),
    email: field(formData, "email"),
    website: field(formData, "website"),
    mainCategoryId: field(formData, "mainCategoryId"),
    subCategoryIds: formData.getAll("subCategoryIds").map(String).filter(Boolean),
    countryId: field(formData, "countryId"),
    stateId: field(formData, "stateId"),
    city: field(formData, "city"),
    area: field(formData, "area"),
    nativePlace: field(formData, "nativePlace"),
    address: field(formData, "address"),
    about: field(formData, "about"),
    productsServices: field(formData, "productsServices"),
    experience: field(formData, "experience"),
    socialLinks: field(formData, "socialLinks"),
    additionalNote: field(formData, "additionalNote"),
  };

  const stateCount = values.countryId ? await prisma.state.count({ where: { countryId: values.countryId } }) : 0;
  const stateRequired = stateCount > 0;

  const errors = validateBusinessForm(values, { stateRequired });
  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 400, error: "Please fix the highlighted fields.", fieldErrors: errors };
  }

  let photoUrl = existing.photoUrl;
  let brochureUrl = existing.brochureUrl;

  const photoFile = formData.get("photo");
  const brochureFile = formData.get("brochure");
  // A freshly-selected file always wins over a "remove" flag — the client
  // clears its own removed-state as soon as a new file is chosen (see
  // RegisterForm's handlePhotoChange/handleBrochureChange), so these flags
  // only ever reach here when the user actually wants a bare removal with
  // no replacement.
  const removePhoto = field(formData, "removePhoto") === "true";
  const removeBrochure = field(formData, "removeBrochure") === "true";

  try {
    if (photoFile instanceof File && photoFile.size > 0) {
      const photoError = validateUploadFile(photoFile, ALLOWED_IMAGE_TYPES);
      if (photoError) return { ok: false, status: 400, error: `Photo rejected: ${photoError}` };

      const inputBuffer = Buffer.from(await photoFile.arrayBuffer());
      if (!verifyFileSignature(inputBuffer, photoFile.type)) {
        return { ok: false, status: 400, error: "Photo rejected: file content doesn't match its declared type." };
      }

      const compressed = await compressImage(inputBuffer, { maxWidth: BUSINESS_PHOTO_MAX_WIDTH, quality: 80 });
      const uploaded = await uploadAsset(
        compressed.buffer,
        "businesses/photos",
        `${crypto.randomUUID()}.webp`,
        "image/webp"
      );
      if (existing.photoUrl) await deleteAsset(existing.photoUrl).catch(() => {});
      photoUrl = uploaded.url;
    } else if (removePhoto && existing.photoUrl) {
      await deleteAsset(existing.photoUrl).catch(() => {});
      photoUrl = null;
    }

    if (brochureFile instanceof File && brochureFile.size > 0) {
      const brochureError = validateUploadFile(brochureFile, ALLOWED_DOCUMENT_TYPES);
      if (brochureError) return { ok: false, status: 400, error: `Brochure rejected: ${brochureError}` };

      const inputBuffer = Buffer.from(await brochureFile.arrayBuffer());
      if (!verifyFileSignature(inputBuffer, brochureFile.type)) {
        return {
          ok: false,
          status: 400,
          error: "Brochure rejected: file content doesn't match its declared type.",
        };
      }

      const ext = path.extname(brochureFile.name) || "";
      const uploaded = await uploadAsset(
        inputBuffer,
        "businesses/brochures",
        `${crypto.randomUUID()}${ext}`,
        brochureFile.type || "application/octet-stream"
      );
      if (existing.brochureUrl) await deleteAsset(existing.brochureUrl).catch(() => {});
      brochureUrl = uploaded.url;
    } else if (removeBrochure && existing.brochureUrl) {
      await deleteAsset(existing.brochureUrl).catch(() => {});
      brochureUrl = null;
    }
  } catch (error) {
    console.error(`Failed to process uploads for business ${existing.id}:`, error);
    return { ok: false, status: 500, error: "File upload failed. Please try again." };
  }

  try {
    const business = await prisma.business.update({
      where: { id: existing.id },
      data: {
        ownerName: values.ownerName,
        businessName: values.businessName,
        establishedYear: values.establishedYear ? Number(values.establishedYear) : null,
        businessPhone: values.businessPhone,
        personalPhone: values.personalPhone || null,
        email: values.email || null,
        website: values.website || null,
        entityId: values.entityId,
        typeId: values.typeId,
        mainCategoryId: values.mainCategoryId,
        countryId: values.countryId,
        stateId: values.stateId || null,
        city: values.city,
        area: values.area || null,
        nativePlace: values.nativePlace || null,
        address: values.address || null,
        about: values.about,
        productsServices: values.productsServices,
        experience: values.experience || null,
        socialLinks: values.socialLinks || null,
        additionalNote: values.additionalNote || null,
        photoUrl,
        brochureUrl,
        // Never touch status/rejectionReason here — an edit to a listing
        // that's already APPROVED must stay APPROVED and visible
        // immediately, not fall back into the pending queue.
        subCategories: {
          deleteMany: {},
          create: values.subCategoryIds.map((subCategoryId) => ({ subCategoryId })),
        },
      },
    });

    return { ok: true, business };
  } catch (error) {
    console.error(`Failed to update business ${existing.id}:`, error);
    return { ok: false, status: 500, error: "Failed to save changes. Please try again." };
  }
}
