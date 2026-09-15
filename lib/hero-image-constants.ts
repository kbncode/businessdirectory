import { MAX_UPLOAD_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/upload-constants";

export const MAX_HERO_IMAGE_BYTES = MAX_UPLOAD_BYTES;
export const ALLOWED_HERO_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;
export const HERO_IMAGE_MAX_WIDTH = 1920;
// 1920x800 — the recommended upload size shown in the admin hint — is the
// aspect ratio the crop modal and the live carousel are both pinned to, so
// a crop the admin approves is exactly what visitors see, not re-cropped a
// second time by a mismatched display container.
export const HERO_IMAGE_ASPECT_RATIO = 1920 / 800;
