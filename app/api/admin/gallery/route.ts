import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compressImage } from "@/lib/image-compression";
import { uploadAsset } from "@/lib/blob-storage";
import { ALLOWED_GALLERY_IMAGE_TYPES, MAX_GALLERY_IMAGE_BYTES, GALLERY_IMAGE_MAX_WIDTH } from "@/lib/gallery-constants";
import { verifyFileSignature } from "@/lib/file-signature";

// sharp needs the Node.js runtime (native bindings) — never move this to Edge.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const caption = String(formData.get("caption") || "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_GALLERY_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_GALLERY_IMAGE_TYPES)[number])) {
    return NextResponse.json({ error: "File must be JPG, PNG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_GALLERY_IMAGE_BYTES) {
    return NextResponse.json({ error: "File must be 3MB or smaller." }, { status: 400 });
  }

  const originalBytes = file.size;
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  if (!verifyFileSignature(inputBuffer, file.type)) {
    return NextResponse.json({ error: "File content doesn't match its declared type." }, { status: 400 });
  }

  const compressed = await compressImage(inputBuffer, { maxWidth: GALLERY_IMAGE_MAX_WIDTH, quality: 80 });

  const { url } = await uploadAsset(compressed.buffer, "gallery", `${crypto.randomUUID()}.webp`, "image/webp");

  const maxSortOrder = await prisma.galleryImage.aggregate({ _max: { sortOrder: true } });
  const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

  const galleryImage = await prisma.galleryImage.create({
    data: {
      imageUrl: url,
      caption: caption || null,
      sortOrder: nextSortOrder,
      originalSizeKb: Math.round(compressed.sizeBytes / 1024),
      width: compressed.width,
      height: compressed.height,
    },
  });

  return NextResponse.json({
    galleryImage,
    originalBytes,
    compressedBytes: compressed.sizeBytes,
  });
}
