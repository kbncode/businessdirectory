export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ...ALLOWED_IMAGE_TYPES,
] as const;

export const BUSINESS_PHOTO_MAX_WIDTH = 1200;
