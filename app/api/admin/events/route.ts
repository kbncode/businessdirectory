import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { compressImage } from "@/lib/image-compression";
import { uploadAsset } from "@/lib/blob-storage";
import { validateUploadFile } from "@/lib/file-validation";
import { verifyFileSignature } from "@/lib/file-signature";
import { ALLOWED_EVENT_PHOTO_TYPES, MAX_EVENT_PHOTO_BYTES, EVENT_PHOTO_MAX_WIDTH } from "@/lib/event-constants";
import { validateEventForm, type EventFormValues } from "@/lib/event-validation";
import { generateUniqueEventSlug, slugify } from "@/lib/slug";
import { createEvent } from "@/lib/queries/admin-events";

// sharp (via compressImage) needs the Node.js runtime — never move to Edge.
export const runtime = "nodejs";
export const maxDuration = 30;

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await request.formData();

  const title = field(formData, "title");
  const requestedSlug = field(formData, "slug");
  const values: EventFormValues = {
    title,
    slug: requestedSlug ? slugify(requestedSlug) : slugify(title),
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

  // Re-derive a collision-safe slug server-side even though the client
  // already sent one (auto-generated from the title) — a race between two
  // admins, or a stale form, shouldn't be able to violate the unique index.
  // generateUniqueEventSlug re-slugifies its input, which is a no-op on an
  // already-slugified string, so passing values.slug straight through is safe.
  values.slug = await generateUniqueEventSlug(values.slug);

  const photoFile = formData.get("photo");
  let photoUrl: string | undefined;

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
    photoUrl = uploaded.url;
  }

  const event = await createEvent(values, photoUrl ? { photoUrl } : undefined);
  return NextResponse.json({ event }, { status: 201 });
}
