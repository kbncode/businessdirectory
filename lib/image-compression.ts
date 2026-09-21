import sharp from "sharp";

export interface CompressedImage {
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface CompressImageOptions {
  maxWidth: number;
  quality?: number;
}

// Resizes to a max width (never upscales) and re-encodes as WebP.
// Node-only (sharp uses native bindings) — never import this from a route
// that could run on the Edge runtime or from a client component.
export async function compressImage(input: Buffer, options: CompressImageOptions): Promise<CompressedImage> {
  const { maxWidth, quality = 80 } = options;

  const buffer = await sharp(input)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    sizeBytes: buffer.byteLength,
  };
}

// Forces an exact square output (center-cropped via fit: "cover") — used
// for small fixed-size icons (e.g. the home page city icons) where there's
// no crop-modal step for the admin to frame the shot themselves, unlike
// compressImage above which only constrains width and keeps the source's
// own aspect ratio.
export async function compressToSquare(input: Buffer, size: number, quality = 80): Promise<CompressedImage> {
  const buffer = await sharp(input)
    .resize({ width: size, height: size, fit: "cover" })
    .webp({ quality })
    .toBuffer();

  return { buffer, width: size, height: size, sizeBytes: buffer.byteLength };
}
