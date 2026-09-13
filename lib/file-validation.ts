import { MAX_UPLOAD_BYTES } from "@/lib/upload-constants";
import { formatBytes } from "@/lib/format";

// Client-safe: no Node-only imports, usable from both client components
// (pre-submit checks) and server route handlers (defense in depth).
export function validateUploadFile(
  file: File,
  allowedTypes: readonly string[],
  maxBytes: number = MAX_UPLOAD_BYTES
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return "Unsupported file type.";
  }
  if (file.size > maxBytes) {
    return `File is ${formatBytes(file.size)} — max allowed is ${formatBytes(maxBytes)}.`;
  }
  return null;
}
