import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Service workers hijack fetches, which breaks Fast Refresh/HMR — only
  // build one for production.
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  // Don't precache uploaded business/hero photos or brochures — they're
  // created at runtime (not known at build time) and are handled instead by
  // the CacheFirst runtime rule below.
  publicExcludes: ["!uploads/**/*"],
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    // The default `exclude` list skips *.woff2 under _next/static, which
    // would leave our self-hosted next/font files (Manrope, Inter) out of
    // the precache. Override it so fonts are precached with the rest of
    // the app shell instead of only being cached after first use.
    exclude: [/\.map$/, /^manifest.*\.js$/],
    runtimeCaching: [
      // ---------- Never cache: admin surface ----------
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin"),
        handler: "NetworkOnly",
      },
      // ---------- Never cache: auth pages + auth API ----------
      {
        urlPattern: ({ url }) =>
          ["/login", "/signup", "/forgot-password", "/reset-password", "/admin/login"].includes(url.pathname) ||
          url.pathname.startsWith("/api/auth"),
        handler: "NetworkOnly",
      },
      // ---------- Never cache: any mutating request, site-wide ----------
      // (Workbox only intercepts GET by default anyway — these are explicit
      // belt-and-braces entries, not strictly required, but make the "never
      // cache mutations" rule impossible to accidentally break later.)
      { urlPattern: () => true, method: "POST", handler: "NetworkOnly" },
      { urlPattern: () => true, method: "PUT", handler: "NetworkOnly" },
      { urlPattern: () => true, method: "PATCH", handler: "NetworkOnly" },
      { urlPattern: () => true, method: "DELETE", handler: "NetworkOnly" },

      // ---------- Cache-first: already-uploaded static images/files ----------
      // Local dev/no-Blob-token fallback storage (same-origin).
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/uploads/"),
        handler: "CacheFirst",
        options: {
          cacheName: "uploaded-files",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Vercel Blob storage (cross-origin, once a real token is configured).
      {
        urlPattern: /^https:\/\/.*\.public\.blob\.vercel-storage\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "uploaded-files-blob",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },

      // ---------- Cache-first: self-hosted font files ----------
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/_next/static/media/"),
        handler: "CacheFirst",
        options: {
          cacheName: "static-fonts",
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },

      // ---------- Network-first: business detail + browse/search ----------
      // So a page you've already opened still works offline, but you get
      // fresh data whenever the network is actually available.
      {
        urlPattern: ({ url }) =>
          url.pathname.startsWith("/business/") || url.pathname === "/browse" || url.pathname === "/search",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
