import { ALLOWED_IMAGE_TYPES } from "@/lib/upload-constants";

// Same 3MB cap + compression target as the gallery uploader.
export const MAX_EVENT_PHOTO_BYTES = 3 * 1024 * 1024;
export const ALLOWED_EVENT_PHOTO_TYPES = ALLOWED_IMAGE_TYPES;
export const EVENT_PHOTO_MAX_WIDTH = 1600;
