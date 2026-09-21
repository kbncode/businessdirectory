import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

// Admin-facing reads/mutations for the "Browse by City" home page section.
// Deliberately separate from lib/queries/home-cities.ts, which is the
// cached, public-facing read the home page itself consumes.

export async function listCitiesWithHomeFeature() {
  return prisma.city.findMany({
    include: {
      state: { select: { name: true } },
      homeFeature: true,
    },
    orderBy: { name: "asc" },
  });
}

// Checking the box creates a HomeCityFeature row (or reactivates an
// existing one via upsert — isActive: false is never a delete, so a
// previously-uploaded icon and sortOrder survive being unfeatured and
// re-featured later). Unchecking just flips isActive to false; if the row
// never existed, that's already the correct end state, so it's a no-op
// rather than an error.
export async function setCityFeatured(cityId: string, featured: boolean) {
  if (featured) {
    const maxSortOrder = await prisma.homeCityFeature.aggregate({ _max: { sortOrder: true } });
    const feature = await prisma.homeCityFeature.upsert({
      where: { cityId },
      update: { isActive: true },
      create: { cityId, isActive: true, sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1 },
    });
    revalidateTag("home-cities");
    return feature;
  }

  const feature = await prisma.homeCityFeature
    .update({ where: { cityId }, data: { isActive: false } })
    .catch(() => null);
  revalidateTag("home-cities");
  return feature;
}

export async function setCityIcon(cityId: string, iconUrl: string | null) {
  const feature = await prisma.homeCityFeature.update({ where: { cityId }, data: { iconUrl } });
  revalidateTag("home-cities");
  return feature;
}

export async function getHomeCityFeatureByCityId(cityId: string) {
  return prisma.homeCityFeature.findUnique({ where: { cityId } });
}

export async function reorderHomeCityFeatures(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.homeCityFeature.update({ where: { id }, data: { sortOrder: index } }))
  );
  revalidateTag("home-cities");
}
