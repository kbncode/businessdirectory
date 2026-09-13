import { prisma } from "@/lib/prisma";

export async function getActiveHeroImages() {
  return prisma.heroImage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllHeroImagesForAdmin() {
  return prisma.heroImage.findMany({
    orderBy: { sortOrder: "asc" },
  });
}
