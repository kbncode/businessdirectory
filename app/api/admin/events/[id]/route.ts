import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { compressImage } from "@/lib/image-compression";
import { uploadAsset, deleteAsset } from "@/lib/blob-storage";
import { validateUploadFile } from "@/lib/file-validation";
import { verifyFileSignature } from "@/lib/file-signature";
import { ALLOWED_EVENT_PHOTO_TYPES, MAX_EVENT_PHOTO_BYTES, EVENT_PHOTO_MAX_WIDTH } from "@/lib/event-constants";
import { validateEventForm, type EventFormValues } from "@/lib/event-validation";
import { generateUniqueEventSlug, slugify } from "@/lib/slug";
import { getEventForAdmin, updateEvent, setEventFeatured, deleteEvent } from "@/lib/queries/admin-events";

// sharp (via compressImage) needs the Node.js runtime — never move to Edge.
export const runtime = "nodejs";
export const maxDuration = 30;

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const event = await getEventForAdmin(params.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  // The admin table's "Featured" switch sends a small JSON toggle — the
  // rest of the event is untouched, so it skips full-form validation
  // entirely rather than requiring the whole edit form's fields.
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.isFeatured !== "boolean") {
      return NextResponse.json({ error: "isFeatured (boolean) is required." }, { status: 400 });
    }
    const event = await setEventFeatured(params.id, body.isFeatured);
    return NextResponse.json({ event });
  }

  const existing = await getEventForAdmin(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const title = field(formData, "title");
  const requestedSlug = field(formData, "slug") || slugify(title);
  const values: EventFormValues = {
    title,
    slug: requestedSlug,
    description: String(formData.get("description") ?? ""),
    eventDate: field(formData, "eventDate"),
    endDate: field(formData, "endDate"),
    location: field(formData, "location"),
    contactName: field(formData, "contactName"),
    contactPhone: field(formData, "contactPhone"),
    contactEmail: field(formData, "contactEmail"),
    isFeatured: field(formData, "isFeatured") === "true",
    status: field(formData, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
  };

  const fieldErrors = validateEventForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors }, { status: 400 });
  }

  if (values.slug !== existing.slug) {
    values.slug = await generateUniqueEventSlug(values.slug, existing.id);
  }

  const photoFile = formData.get("photo");
  let photoUpdate: { photoUrl: string } | undefined;
  let oldPhotoUrlToDelete: string | null = null;

  if (photoFile instanceof File && photoFile.size > 0) {
    const photoError = validateUploadFile(photoFile, ALLOWED_EVENT_PHOTO_TYPES, MAX_EVENT_PHOTO_BYTES);
    if (photoError) {
      return NextResponse.json({ error: photoError }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await photoFile.arrayBuffer());
    if (!verifyFileSignature(inputBuffer, photoFile.type)) {
      return NextResponse.json({ error: "Photo content doesn't match its declared type." }, { status: 400 });
    }

    const compressed = await compressImage(inputBuffer, { maxWidth: EVENT_PHOTO_MAX_WIDTH, quality: 80 });
    const uploaded = await uploadAsset(compressed.buffer, "events", `${crypto.randomUUID()}.webp`, "image/webp");
    photoUpdate = { photoUrl: uploaded.url };
    oldPhotoUrlToDelete = existing.photoUrl;
  }

  const result = await updateEvent(params.id, values, photoUpdate);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  if (oldPhotoUrlToDelete) await deleteAsset(oldPhotoUrlToDelete).catch(() => {});

  return NextResponse.json({ event: result.event });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await getEventForAdmin(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  await deleteEvent(params.id);
  if (existing.photoUrl) await deleteAsset(existing.photoUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}
