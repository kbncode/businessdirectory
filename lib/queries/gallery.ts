import { prisma } from "@/lib/prisma";

export async function getActiveGalleryImages() {
  return prisma.galleryImage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllGalleryImagesForAdmin() {
  return prisma.galleryImage.findMany({
    orderBy: { sortOrder: "asc" },
  });
}
