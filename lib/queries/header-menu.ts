import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolveHeaderMenuHref } from "@/lib/header-menu-validation";

// Renders on every page load via the root layout, so it's cached and
// invalidated by tag from the admin mutations (lib/queries/admin-header-menu.ts)
// rather than hitting the DB on every request.
export const getActiveHeaderMenuItems = unstable_cache(
  async () => {
    const items = await prisma.headerMenuItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // A PAGE-type item is only ever shown if its target page is still
    // published — otherwise the nav would link straight into a 404 the
    // moment an admin unpublishes or deletes that page without also
    // remembering to update the menu.
    const pageSlugs = items.filter((i) => i.linkType === "PAGE" && i.pageSlug).map((i) => i.pageSlug as string);
    const publishedSlugs =
      pageSlugs.length > 0
        ? new Set(
            (
              await prisma.page.findMany({
                where: { slug: { in: pageSlugs }, status: "PUBLISHED" },
                select: { slug: true },
              })
            ).map((p) => p.slug)
          )
        : new Set<string>();

    return items
      .filter((item) => item.linkType !== "PAGE" || (item.pageSlug && publishedSlugs.has(item.pageSlug)))
      .map((item) => ({ ...item, href: resolveHeaderMenuHref(item) }));
  },
  ["header-menu"],
  { tags: ["header-menu"] }
);
