import { prisma } from "@/lib/prisma";

// Public-facing Page reads only — always scoped to status: PUBLISHED.
// Deliberately separate from lib/queries/admin-pages.ts (draft-visible,
// mutation-capable) so nothing here can accidentally leak a draft.

export async function getPublishedPageBySlug(slug: string) {
  return prisma.page.findFirst({ where: { slug, status: "PUBLISHED" } });
}

// Used by the /[slug] catch-all, which only ever serves CUSTOM pages —
// the About page has its own dedicated /about-us route.
export async function getPublishedCustomPageBySlug(slug: string) {
  return prisma.page.findFirst({ where: { slug, status: "PUBLISHED", type: "CUSTOM" } });
}
