import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface FooterLinkSection {
  section: string;
  links: Awaited<ReturnType<typeof prisma.footerLink.findMany>>;
}

// Same rationale as getActiveHeaderMenuItems: renders on every page via the
// root layout, so it's cached and invalidated by tag from admin mutations.
export const getActiveFooterLinksGrouped = unstable_cache(
  async (): Promise<FooterLinkSection[]> => {
    const links = await prisma.footerLink.findMany({
      where: { isActive: true },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
    });

    const bySection = new Map<string, typeof links>();
    for (const link of links) {
      const group = bySection.get(link.section);
      if (group) group.push(link);
      else bySection.set(link.section, [link]);
    }

    return Array.from(bySection.entries()).map(([section, groupLinks]) => ({ section, links: groupLinks }));
  },
  ["footer-links"],
  { tags: ["footer-links"] }
);
