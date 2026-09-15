import { prisma } from "@/lib/prisma";

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      // Postgres text columns don't cap length, but keep URLs sane.
      .slice(0, 80)
      .replace(/-+$/g, "") || "business"
  );
}

// Appends -2, -3, ... on collision. excludeId lets an edit re-check without
// tripping over the row's own existing slug (not currently used — slugs are
// stable post-creation — but kept so a future "regenerate slug" action has
// somewhere to plug in without duplicating this logic).
export async function generateUniqueSlug(businessName: string, excludeId?: string): Promise<string> {
  const base = slugify(businessName);
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.business.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

// Same collision-suffix approach as generateUniqueSlug above, over Page
// instead of Business. Kept separate rather than made generic since the two
// models aren't related and a shared helper would need an awkward
// delegate-table parameter for no real benefit at this size.
export async function generateUniquePageSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.page.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
