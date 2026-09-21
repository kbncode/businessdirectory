import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// The public, cached read the home page's "Browse by City" section will
// consume — tagged "home-cities" so every admin mutation in
// lib/queries/admin-home-cities.ts (feature/unfeature, icon change,
// reorder) can invalidate it with revalidateTag, same pattern as
// getActiveHeaderMenuItems.
export const getFeaturedHomeCities = unstable_cache(
  async () => {
    return prisma.homeCityFeature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        city: { select: { id: true, name: true, state: { select: { name: true } } } },
      },
    });
  },
  ["home-cities"],
  { tags: ["home-cities"] }
);
