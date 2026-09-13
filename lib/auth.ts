import { auth as viewerAuth } from "@/lib/auth-viewer";
import { auth as adminAuth } from "@/lib/auth-admin";

// Thin wrappers so pages/API routes don't need to know which NextAuth
// instance backs which kind of session.
export function getViewerSession() {
  return viewerAuth();
}

export function getAdminSession() {
  return adminAuth();
}
