import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compressImage } from "@/lib/image-compression";
import { uploadAsset } from "@/lib/blob-storage";
import { ALLOWED_HERO_IMAGE_TYPES, MAX_HERO_IMAGE_BYTES, HERO_IMAGE_MAX_WIDTH } from "@/lib/hero-image-constants";
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
  const altText = String(formData.get("altText") || "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!altText) {
    return NextResponse.json({ error: "Alt text is required." }, { status: 400 });
  }
  if (!ALLOWED_HERO_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_HERO_IMAGE_TYPES)[number])) {
    return NextResponse.json({ error: "File must be JPG, PNG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_HERO_IMAGE_BYTES) {
    return NextResponse.json({ error: "File must be 5MB or smaller." }, { status: 400 });
  }

  const originalBytes = file.size;
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  if (!verifyFileSignature(inputBuffer, file.type)) {
    return NextResponse.json({ error: "File content doesn't match its declared type." }, { status: 400 });
  }

  const compressed = await compressImage(inputBuffer, { maxWidth: HERO_IMAGE_MAX_WIDTH, quality: 80 });

  const { url } = await uploadAsset(compressed.buffer, "hero-images", `${crypto.randomUUID()}.webp`, "image/webp");

  const maxSortOrder = await prisma.heroImage.aggregate({ _max: { sortOrder: true } });
  const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

  const heroImage = await prisma.heroImage.create({
    data: {
      imageUrl: url,
      altText,
      sortOrder: nextSortOrder,
      originalSizeKb: Math.round(compressed.sizeBytes / 1024),
      width: compressed.width,
      height: compressed.height,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({
    heroImage,
    originalBytes,
    compressedBytes: compressed.sizeBytes,
  });
}
