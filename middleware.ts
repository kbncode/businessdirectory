import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { viewerAuthConfig } from "@/lib/auth-viewer.config";
import { adminAuthConfig } from "@/lib/auth-admin.config";

// Built from the edge-safe configs (no Prisma) so middleware can decode
// the JWT session cookie without pulling Prisma into the Edge runtime.
const { auth: viewerAuth } = NextAuth(viewerAuthConfig);
const { auth: adminAuth } = NextAuth(adminAuthConfig);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Forwarded so the root layout (a Server Component with no direct access
  // to the current URL) can decide whether to render the public Header —
  // it's hidden for a logged-in admin viewing the admin panel.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname.startsWith("/api/admin")) {
    const session = await adminAuth();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
  } else if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await adminAuth();
    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/my-listings")) {
    const session = await viewerAuth();
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/my-listings/:path*"],
};
