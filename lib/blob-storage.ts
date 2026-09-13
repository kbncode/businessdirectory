import fs from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";

const LOCAL_UPLOAD_ROOT = "/uploads/";

function hasRealBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return Boolean(token && !token.includes("xxxxxxxx"));
}

// Vercel Blob when a real token is configured; otherwise falls back to
// writing straight into /public for local dev, so uploads can be tested
// before a real BLOB_READ_WRITE_TOKEN exists. The local fallback only makes
// sense off Vercel (its filesystem is read-only in production), so it
// refuses to run there rather than silently writing to a throwaway /tmp.
export async function uploadAsset(
  buffer: Buffer,
  folder: string,
  filename: string,
  contentType: string
): Promise<{ url: string; storage: "blob" | "local" }> {
  if (hasRealBlobToken()) {
    const blob = await put(`${folder}/${filename}`, buffer, { access: "public", contentType });
    return { url: blob.url, storage: "blob" };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Set a real token in the Vercel project's environment variables."
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);

  return { url: `${LOCAL_UPLOAD_ROOT}${folder}/${filename}`, storage: "local" };
}

export async function deleteAsset(url: string): Promise<void> {
  if (url.startsWith(LOCAL_UPLOAD_ROOT)) {
    const filePath = path.join(process.cwd(), "public", url);
    await fs.unlink(filePath).catch(() => {});
    return;
  }

  await del(url);
}
