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
        city: {
          select: {
            id: true,
            name: true,
            state: { select: { id: true, name: true, countryId: true } },
          },
        },
      },
    });
  },
  ["home-cities"],
  { tags: ["home-cities"] }
);

export interface FeaturedCity {
  id: string;
  name: string;
  iconUrl: string | null;
  stateId: string;
  countryId: string;
}

// Shaped for the home page's "Browse by City" section — /browse's filter
// query params (Step 4) are countryId/stateId/city-name, so this carries
// exactly those, not the raw HomeCityFeature/City join shape.
export async function getFeaturedCities(): Promise<FeaturedCity[]> {
  const rows = await getFeaturedHomeCities();
  return rows.map((row) => ({
    id: row.city.id,
    name: row.city.name,
    iconUrl: row.iconUrl,
    stateId: row.city.state.id,
    countryId: row.city.state.countryId,
  }));
}
