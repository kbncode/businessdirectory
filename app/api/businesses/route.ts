import path from "path";
import { NextResponse } from "next/server";
import { getViewerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compressImage } from "@/lib/image-compression";
import { uploadAsset } from "@/lib/blob-storage";
import { getAppMessage } from "@/lib/queries/app-messages";
import { validateUploadFile } from "@/lib/file-validation";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, BUSINESS_PHOTO_MAX_WIDTH } from "@/lib/upload-constants";
import { validateBusinessForm, type BusinessFormValues } from "@/lib/business-form-validation";
import { sendEmail } from "@/lib/email";
import RegistrationReceived from "@/emails/RegistrationReceived";
import AdminNewSubmission from "@/emails/AdminNewSubmission";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { verifyFileSignature } from "@/lib/file-signature";
import { generateUniqueSlug } from "@/lib/slug";

const ADMIN_ALERT_EMAIL = "kbn.gky@gmail.com";
const HONEYPOT_FIELD = "website_url";

// sharp (via compressImage) needs the Node.js runtime — never move to Edge.
export const runtime = "nodejs";
// sharp compression on a large photo/brochure upload can take a while —
// give it real headroom instead of hitting the platform's default timeout.
export const maxDuration = 30;

const FAILURE_MESSAGE_KEY = "Registration Faiure!";
const FALLBACK_FAILURE_MESSAGE = "Registration failed. Please try again.";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function failureResponse(status: number, detail: string, fieldErrors?: Record<string, string>) {
  console.error(`Business registration failed: ${detail}`);
  const message = (await getAppMessage(FAILURE_MESSAGE_KEY)) ?? FALLBACK_FAILURE_MESSAGE;
  return NextResponse.json({ error: message, fieldErrors }, { status });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`register:${ip}`, 5, 60 * 60);
  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  const session = await getViewerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "You must be logged in to register a business." }, { status: 401 });
  }
  const submitterEmail = session.user.email;

  const formData = await request.formData();

  if (field(formData, HONEYPOT_FIELD)) {
    console.warn(
      `Honeypot triggered on business registration from IP ${ip}: ${HONEYPOT_FIELD}="${field(formData, HONEYPOT_FIELD)}"`
    );
    // Pretend success — never reveal the bot was caught.
    return NextResponse.json({ business: null }, { status: 201 });
  }

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
    return failureResponse(400, `Validation failed: ${JSON.stringify(errors)}`, errors);
  }

  const photoFile = formData.get("photo");
  const brochureFile = formData.get("brochure");

  let photoUrl: string | undefined;
  let brochureUrl: string | undefined;

  try {
    if (photoFile instanceof File && photoFile.size > 0) {
      const photoError = validateUploadFile(photoFile, ALLOWED_IMAGE_TYPES);
      if (photoError) return failureResponse(400, `Photo rejected: ${photoError}`);

      const inputBuffer = Buffer.from(await photoFile.arrayBuffer());
      if (!verifyFileSignature(inputBuffer, photoFile.type)) {
        return failureResponse(400, `Photo rejected: file content doesn't match its declared type.`);
      }

      const compressed = await compressImage(inputBuffer, { maxWidth: BUSINESS_PHOTO_MAX_WIDTH, quality: 80 });
      const uploaded = await uploadAsset(
        compressed.buffer,
        "businesses/photos",
        `${crypto.randomUUID()}.webp`,
        "image/webp"
      );
      photoUrl = uploaded.url;
    }

    if (brochureFile instanceof File && brochureFile.size > 0) {
      const brochureError = validateUploadFile(brochureFile, ALLOWED_DOCUMENT_TYPES);
      if (brochureError) return failureResponse(400, `Brochure rejected: ${brochureError}`);

      const inputBuffer = Buffer.from(await brochureFile.arrayBuffer());
      if (!verifyFileSignature(inputBuffer, brochureFile.type)) {
        return failureResponse(400, `Brochure rejected: file content doesn't match its declared type.`);
      }

      const ext = path.extname(brochureFile.name) || "";
      const uploaded = await uploadAsset(
        inputBuffer,
        "businesses/brochures",
        `${crypto.randomUUID()}${ext}`,
        brochureFile.type || "application/octet-stream"
      );
      brochureUrl = uploaded.url;
    }
  } catch (error) {
    return failureResponse(500, `Upload failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const slug = await generateUniqueSlug(values.businessName);
    const business = await prisma.business.create({
      data: {
        slug,
        submittedById: session.user.id,
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
        status: "PENDING",
        subCategories: {
          create: values.subCategoryIds.map((subCategoryId) => ({ subCategoryId })),
        },
      },
      include: { mainCategory: true },
    });

    try {
      await sendEmail(
        submitterEmail,
        "We've received your business listing submission",
        RegistrationReceived({ businessName: business.businessName })
      );
    } catch (emailError) {
      console.error(
        `Failed to send RegistrationReceived email for business ${business.id} to ${submitterEmail}:`,
        emailError
      );
    }

    try {
      await sendEmail(
        ADMIN_ALERT_EMAIL,
        `New business submission: ${business.businessName}`,
        AdminNewSubmission({
          businessName: business.businessName,
          category: business.mainCategory.name,
          city: business.city,
          submitterEmail,
        })
      );
    } catch (emailError) {
      console.error(`Failed to send AdminNewSubmission email for business ${business.id}:`, emailError);
    }

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    return failureResponse(500, `Database write failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
