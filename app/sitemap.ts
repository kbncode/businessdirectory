import type { MetadataRoute } from "next";
import { getApprovedBusinessesForSitemap } from "@/lib/queries/business";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await getApprovedBusinessesForSitemap();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/browse`, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const businessRoutes: MetadataRoute.Sitemap = businesses.map((business) => ({
    url: `${APP_URL}/business/${business.id}`,
    lastModified: business.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...businessRoutes];
}
