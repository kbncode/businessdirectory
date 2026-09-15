import { prisma } from "@/lib/prisma";
import type { PageFormValues } from "@/lib/page-validation";

// Admin-facing Page queries/mutations. Pages are a handful of rows at most
// (nav-level content, not user-submitted data), so unlike the business
// tables this deliberately skips cursor pagination — a plain findMany is
// simplest and won't need revisiting at this scale.

export async function getPagesForAdmin() {
  return prisma.page.findMany({
    orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getPageForAdmin(id: string) {
  return prisma.page.findUnique({ where: { id } });
}

export interface CreatePageResult {
  ok: true;
  page: Awaited<ReturnType<typeof getPageForAdmin>>;
}
export interface CreatePageError {
  ok: false;
  error: string;
}

// CUSTOM pages only — the ABOUT page is a fixed singleton seeded once and
// never created through this path.
export async function createCustomPage(
  values: Pick<PageFormValues, "title" | "slug" | "content" | "status" | "seoTitle" | "seoDescription">
): Promise<CreatePageResult | CreatePageError> {
  const existing = await prisma.page.findUnique({ where: { slug: values.slug } });
  if (existing) {
    return { ok: false, error: `Slug "${values.slug}" is already in use.` };
  }

  const page = await prisma.page.create({
    data: {
      title: values.title,
      slug: values.slug,
      content: values.content,
      type: "CUSTOM",
      status: values.status,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
    },
  });

  return { ok: true, page };
}

export async function updatePage(
  id: string,
  values: Pick<PageFormValues, "title" | "slug" | "content" | "status" | "seoTitle" | "seoDescription">
): Promise<CreatePageResult | CreatePageError> {
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "Page not found." };
  }

  // The About page's slug is fixed — even if the editor somehow submits a
  // different value, it's silently ignored rather than trusted.
  const nextSlug = existing.type === "ABOUT" ? existing.slug : values.slug;

  if (nextSlug !== existing.slug) {
    const collision = await prisma.page.findFirst({ where: { slug: nextSlug, id: { not: id } } });
    if (collision) {
      return { ok: false, error: `Slug "${nextSlug}" is already in use.` };
    }
  }

  const page = await prisma.page.update({
    where: { id },
    data: {
      title: values.title,
      slug: nextSlug,
      content: values.content,
      status: values.status,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
    },
  });

  return { ok: true, page };
}

export interface DeletePageResult {
  ok: boolean;
  message?: string;
}

export async function deleteCustomPage(id: string): Promise<DeletePageResult> {
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return { ok: false, message: "Page not found." };
  if (page.type === "ABOUT") {
    return { ok: false, message: "The About page is a system page and can't be deleted." };
  }

  await prisma.page.delete({ where: { id } });
  return { ok: true };
}
