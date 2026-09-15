import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { HeaderMenuItemFormValues } from "@/lib/header-menu-validation";

export async function getHeaderMenuItemsForAdmin() {
  return prisma.headerMenuItem.findMany({ orderBy: { sortOrder: "asc" } });
}

function toData(values: HeaderMenuItemFormValues, isActive: boolean) {
  return {
    label: values.label.trim(),
    linkType: values.linkType,
    pageSlug: values.linkType === "PAGE" ? values.pageSlug : null,
    systemRoute: values.linkType === "SYSTEM" ? values.systemRoute : null,
    externalUrl: values.linkType === "EXTERNAL" ? values.externalUrl.trim() : null,
    openInNewTab: values.linkType === "EXTERNAL" ? values.openInNewTab : false,
    isCta: values.isCta,
    isActive,
  };
}

export async function createHeaderMenuItem(values: HeaderMenuItemFormValues) {
  const maxSortOrder = await prisma.headerMenuItem.aggregate({ _max: { sortOrder: true } });
  const item = await prisma.headerMenuItem.create({
    data: { ...toData(values, true), sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1 },
  });
  revalidateTag("header-menu");
  return item;
}

export async function updateHeaderMenuItem(id: string, values: HeaderMenuItemFormValues) {
  const existing = await prisma.headerMenuItem.findUnique({ where: { id } });
  if (!existing) return null;

  const item = await prisma.headerMenuItem.update({
    where: { id },
    data: toData(values, existing.isActive),
  });
  revalidateTag("header-menu");
  return item;
}

export async function setHeaderMenuItemActive(id: string, isActive: boolean) {
  const item = await prisma.headerMenuItem.update({ where: { id }, data: { isActive } });
  revalidateTag("header-menu");
  return item;
}

export async function deleteHeaderMenuItem(id: string) {
  await prisma.headerMenuItem.delete({ where: { id } });
  revalidateTag("header-menu");
}

export async function reorderHeaderMenuItems(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.headerMenuItem.update({ where: { id }, data: { sortOrder: index } }))
  );
  revalidateTag("header-menu");
}
