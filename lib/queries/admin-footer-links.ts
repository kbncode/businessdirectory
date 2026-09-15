import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { FooterLinkFormValues } from "@/lib/footer-link-validation";

export async function getFooterLinksForAdmin() {
  return prisma.footerLink.findMany({ orderBy: [{ section: "asc" }, { sortOrder: "asc" }] });
}

export async function createFooterLink(values: FooterLinkFormValues) {
  const maxSortOrder = await prisma.footerLink.aggregate({
    _max: { sortOrder: true },
    where: { section: values.section.trim() },
  });
  const link = await prisma.footerLink.create({
    data: {
      section: values.section.trim(),
      label: values.label.trim(),
      url: values.url.trim(),
      icon: values.icon || null,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      isActive: true,
    },
  });
  revalidateTag("footer-links");
  return link;
}

export async function updateFooterLink(id: string, values: FooterLinkFormValues) {
  const existing = await prisma.footerLink.findUnique({ where: { id } });
  if (!existing) return null;

  // Moving a link into a brand-new section puts it at the end of that
  // section's order rather than keeping whatever sortOrder it had in its
  // old section, which would otherwise land it at an arbitrary position.
  let sortOrder = existing.sortOrder;
  if (values.section.trim() !== existing.section) {
    const maxSortOrder = await prisma.footerLink.aggregate({
      _max: { sortOrder: true },
      where: { section: values.section.trim() },
    });
    sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;
  }

  const link = await prisma.footerLink.update({
    where: { id },
    data: {
      section: values.section.trim(),
      label: values.label.trim(),
      url: values.url.trim(),
      icon: values.icon || null,
      sortOrder,
    },
  });
  revalidateTag("footer-links");
  return link;
}

export async function setFooterLinkActive(id: string, isActive: boolean) {
  const link = await prisma.footerLink.update({ where: { id }, data: { isActive } });
  revalidateTag("footer-links");
  return link;
}

export async function deleteFooterLink(id: string) {
  await prisma.footerLink.delete({ where: { id } });
  revalidateTag("footer-links");
}

export async function reorderFooterLinksInSection(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.footerLink.update({ where: { id }, data: { sortOrder: index } }))
  );
  revalidateTag("footer-links");
}
