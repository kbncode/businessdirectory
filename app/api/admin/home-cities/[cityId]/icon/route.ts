import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { compressToSquare } from "@/lib/image-compression";
import { uploadAsset, deleteAsset } from "@/lib/blob-storage";
import { validateUploadFile } from "@/lib/file-validation";
import { verifyFileSignature } from "@/lib/file-signature";
import { ALLOWED_CITY_ICON_TYPES, MAX_CITY_ICON_BYTES, CITY_ICON_SIZE } from "@/lib/city-icon-constants";
import { getHomeCityFeatureByCityId, setCityIcon } from "@/lib/queries/admin-home-cities";

// sharp needs the Node.js runtime (native bindings) — never move this to Edge.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: { cityId: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // The icon control only ever renders for an already-featured city, but
  // the check is repeated here since the client's render state is never
  // trusted as the actual authorization for a write.
  const existing = await getHomeCityFeatureByCityId(params.cityId);
  if (!existing) {
    return NextResponse.json({ error: "This city isn't featured yet." }, { status: 409 });
  }

  const formData = await request.formData();
  const file = formData.get("icon");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const validationError = validateUploadFile(file, ALLOWED_CITY_ICON_TYPES, MAX_CITY_ICON_BYTES);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  if (!verifyFileSignature(inputBuffer, file.type)) {
    return NextResponse.json({ error: "File content doesn't match its declared type." }, { status: 400 });
  }

  const compressed = await compressToSquare(inputBuffer, CITY_ICON_SIZE);
  const uploaded = await uploadAsset(compressed.buffer, "home-cities", `${crypto.randomUUID()}.webp`, "image/webp");

  if (existing.iconUrl) await deleteAsset(existing.iconUrl).catch(() => {});

  const feature = await setCityIcon(params.cityId, uploaded.url);
  return NextResponse.json({ feature, iconUrl: feature.iconUrl });
}

export async function DELETE(_request: Request, { params }: { params: { cityId: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await getHomeCityFeatureByCityId(params.cityId);
  if (!existing) {
    return NextResponse.json({ error: "This city isn't featured yet." }, { status: 409 });
  }

  if (existing.iconUrl) {
    await deleteAsset(existing.iconUrl).catch((error) => {
      console.error(`Failed to delete stored icon for city ${params.cityId}:`, error);
    });
  }

  const feature = await setCityIcon(params.cityId, null);
  return NextResponse.json({ feature });
}
