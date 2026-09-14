import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/cursor";

export interface BusinessFilters {
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  mainCategory?: string;
  subCategories?: string[];
  q?: string;
}

// Hard cap enforced here, not just at the call site — a caller (or a
// crafted request to the /api/businesses/search route) can ask for a
// smaller page but never a larger one.
const MAX_PAGE_SIZE = 20;

export interface BrowseListItem {
  id: string;
  slug: string;
  businessName: string;
  about: string | null;
  productsServices: string | null;
  city: string;
  area: string | null;
  photoUrl: string | null;
  mainCategoryName: string;
  countryName: string;
  stateName: string | null;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

// Builds the WHERE clause shared by the count query and the keyset page
// query below. Every value is bound as a query parameter via Prisma.sql
// tagged-template interpolation — never string-concatenated — so this stays
// immune to SQL injection despite being raw SQL.
function buildSearchWhere(filters: BusinessFilters, cursor?: { createdAt: Date; id: string }) {
  const conditions: Prisma.Sql[] = [Prisma.sql`b.status = 'APPROVED'::"BusinessStatus"`];

  if (filters.country) conditions.push(Prisma.sql`b."countryId" = ${filters.country}`);
  if (filters.state) conditions.push(Prisma.sql`b."stateId" = ${filters.state}`);
  if (filters.city) conditions.push(Prisma.sql`b.city ILIKE ${filters.city}`);
  if (filters.area) conditions.push(Prisma.sql`b.area ILIKE ${filters.area}`);
  if (filters.mainCategory) conditions.push(Prisma.sql`b."mainCategoryId" = ${filters.mainCategory}`);

  if (filters.subCategories && filters.subCategories.length > 0) {
    conditions.push(
      Prisma.sql`EXISTS (
        SELECT 1 FROM "business_sub_category_map" map
        WHERE map."businessId" = b.id AND map."subCategoryId" IN (${Prisma.join(filters.subCategories)})
      )`
    );
  }

  // Full-text search against the generated tsvector column instead of an
  // unindexed `contains` scan — see the add_search_and_indexes migration
  // for the column/GIN index definition. websearch_to_tsquery tolerates
  // free-typed user input (quotes, "-word" exclusions) without erroring.
  if (filters.q) {
    conditions.push(Prisma.sql`b."searchVector" @@ websearch_to_tsquery('english', ${filters.q})`);
  }

  if (cursor) {
    // createdAt is stored as `timestamp without time zone`. Binding a JS
    // Date directly here goes through node-postgres's Date serialization,
    // which applies the server process's local timezone offset and can
    // shift the compared value away from what's actually stored — passing
    // the ISO string and casting it in SQL keeps the naive wall-clock value
    // intact instead.
    conditions.push(Prisma.sql`(b."createdAt", b.id) < (${cursor.createdAt.toISOString()}::timestamp, ${cursor.id})`);
  }

  return Prisma.join(conditions, " AND ");
}

interface RawBrowseRow {
  id: string;
  slug: string;
  businessName: string;
  about: string | null;
  productsServices: string | null;
  city: string;
  area: string | null;
  photoUrl: string | null;
  createdAt: Date;
  mainCategoryName: string;
  countryName: string;
  stateName: string | null;
}

export async function searchApprovedBusinessesCursor(
  filters: BusinessFilters,
  cursorToken?: string,
  limit = MAX_PAGE_SIZE
): Promise<CursorPage<BrowseListItem>> {
  const take = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
  const cursor = cursorToken ? decodeCursor(cursorToken) ?? undefined : undefined;
  const where = buildSearchWhere(filters, cursor);

  // Only the fields the BusinessCard grid actually renders — no
  // brochureUrl/contact fields. The full record is reserved for the
  // single business detail page.
  const rows = await prisma.$queryRaw<RawBrowseRow[]>`
    SELECT b.id, b.slug, b."businessName", b.about, b."productsServices", b.city, b.area, b."photoUrl", b."createdAt",
           mc.name AS "mainCategoryName", c.name AS "countryName", s.name AS "stateName"
    FROM "businesses" b
    JOIN "business_main_categories" mc ON mc.id = b."mainCategoryId"
    JOIN "countries" c ON c.id = b."countryId"
    LEFT JOIN "states" s ON s.id = b."stateId"
    WHERE ${where}
    ORDER BY b."createdAt" DESC, b.id DESC
    LIMIT ${take + 1}
  `;

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;
  const last = page[page.length - 1];

  return {
    items: page.map((row) => ({
      id: row.id,
      slug: row.slug,
      businessName: row.businessName,
      about: row.about,
      productsServices: row.productsServices,
      city: row.city,
      area: row.area,
      photoUrl: row.photoUrl,
      mainCategoryName: row.mainCategoryName,
      countryName: row.countryName,
      stateName: row.stateName,
    })),
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function countApprovedBusinesses(filters: BusinessFilters): Promise<number> {
  const where = buildSearchWhere(filters);
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "businesses" b WHERE ${where}
  `;
  return Number(rows[0]?.count ?? 0);
}

const BUSINESS_CARD_SELECT = {
  id: true,
  slug: true,
  businessName: true,
  about: true,
  productsServices: true,
  city: true,
  area: true,
  photoUrl: true,
  mainCategory: { select: { name: true } },
  country: { select: { name: true } },
  state: { select: { name: true } },
} satisfies Prisma.BusinessSelect;

// Home page "Featured listings" cap — 8 slots (2 rows of 4 on desktop).
export const MAX_FEATURED_LISTINGS = 8;

// A featured row only counts once it's actually APPROVED, isFeatured, and
// the current time falls inside [featuredStartDate, featuredEndDate]
// (either bound may be open-ended). Reused by both the public query below
// and the admin feature-toggle route's slot-limit check, so an expired
// listing frees up its slot automatically without any cron job.
export function activeFeaturedWhere(now: Date, excludeId?: string): Prisma.BusinessWhereInput {
  return {
    status: "APPROVED",
    isFeatured: true,
    id: excludeId ? { not: excludeId } : undefined,
    AND: [
      { OR: [{ featuredStartDate: null }, { featuredStartDate: { lte: now } }] },
      { OR: [{ featuredEndDate: null }, { featuredEndDate: { gte: now } }] },
    ],
  };
}

export async function getFeaturedBusinesses(limit = MAX_FEATURED_LISTINGS) {
  return prisma.business.findMany({
    where: activeFeaturedWhere(new Date()),
    orderBy: [{ featuredStartDate: "desc" }, { createdAt: "desc" }],
    take: Math.min(limit, MAX_FEATURED_LISTINGS),
    select: BUSINESS_CARD_SELECT,
  });
}

export async function countActiveFeaturedBusinesses(excludeId?: string) {
  return prisma.business.count({ where: activeFeaturedWhere(new Date(), excludeId) });
}

// Full record — only ever used on the single business detail page. Keyed by
// slug since that's what the public URL uses; the slug is stable once
// generated at creation, so this never needs to handle a "moved" listing.
export async function getApprovedBusinessBySlug(slug: string) {
  return prisma.business.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      mainCategory: true,
      entity: true,
      type: true,
      country: true,
      state: true,
      subCategories: { include: { subCategory: true } },
    },
  });
}

const MASTER_DATA_CACHE_TAGS = [
  "master-data-countries",
  "master-data-states",
  "master-data-cities",
  "master-data-business-main-categories",
  "master-data-business-sub-categories",
];

// Master data (countries/states/cities/categories) barely ever changes —
// cached across requests and revalidated by tag from the admin master-data
// mutation routes instead of re-querying on every registration/browse hit.
export const getMainCategories = unstable_cache(
  async () => prisma.businessMainCategory.findMany({ orderBy: { name: "asc" } }),
  ["master-data-main-categories"],
  { tags: ["master-data-business-main-categories"] }
);

export const getFilterMasterData = unstable_cache(
  async () => {
    const [countries, states, cities, mainCategories, subCategories] = await Promise.all([
      prisma.country.findMany({ orderBy: { name: "asc" } }),
      prisma.state.findMany({ orderBy: { name: "asc" } }),
      prisma.city.findMany({ orderBy: { name: "asc" } }),
      prisma.businessMainCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.businessSubCategory.findMany({ orderBy: { name: "asc" } }),
    ]);
    return { countries, states, cities, mainCategories, subCategories };
  },
  ["master-data-filter-set"],
  { tags: MASTER_DATA_CACHE_TAGS }
);

export const getBusinessEntities = unstable_cache(
  async () => prisma.businessEntity.findMany({ orderBy: { name: "asc" } }),
  ["master-data-business-entities"],
  { tags: ["master-data-business-entities"] }
);

export const getBusinessTypes = unstable_cache(
  async () => prisma.businessType.findMany({ orderBy: { name: "asc" } }),
  ["master-data-business-types"],
  { tags: ["master-data-business-types"] }
);

export async function getApprovedBusinessesForSitemap() {
  return prisma.business.findMany({
    where: { status: "APPROVED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAreaSuggestions(city?: string) {
  if (!city) return [];

  const rows = await prisma.business.findMany({
    where: { status: "APPROVED", city: { equals: city, mode: "insensitive" }, area: { not: null } },
    select: { area: true },
    distinct: ["area"],
    take: 25,
  });

  return rows.map((row) => row.area).filter((area): area is string => Boolean(area));
}
