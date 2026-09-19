import { prisma } from "@/lib/prisma";
import { eachDayIso, type ResolvedDateRange } from "@/lib/date-range";

// All aggregation for /dashboard lives here — the page and its client filter
// components only ever pass in an ownerId + resolved scope, never touch
// Prisma directly. Kept separate from lib/queries/promotions.ts and
// lib/queries/my-listings.ts (viewer-scoped CRUD reads) since this file is
// specifically about rollups/trends for the dashboard's cards and charts.
//
// The date-range preset type/resolver (DateRangePreset, resolveDateRange)
// moved to lib/date-range.ts, shared with lib/queries/admin-dashboard.ts —
// re-exported here so existing imports from this file keep working.
export { type DateRangePreset, resolveDateRange } from "@/lib/date-range";

export interface OwnerBusinessOption {
  id: string;
  businessName: string;
}

export async function getOwnerBusinessOptions(ownerId: string): Promise<OwnerBusinessOption[]> {
  return prisma.business.findMany({
    where: { submittedById: ownerId },
    select: { id: true, businessName: true },
    orderBy: { businessName: "asc" },
  });
}

// Never trusts a client-supplied businessId beyond checking it's actually
// one of this owner's own — same "look it up, then verify ownership"
// pattern as getMyPromotionById elsewhere. Returns null (not an empty
// array) for "no filter", so callers can tell "all businesses" apart from
// "this owner literally has none".
export async function resolveOwnerBusinessIds(
  ownerId: string,
  requestedBusinessId: string | null
): Promise<string[]> {
  const businesses = await getOwnerBusinessOptions(ownerId);
  if (requestedBusinessId && businesses.some((b) => b.id === requestedBusinessId)) {
    return [requestedBusinessId];
  }
  return businesses.map((b) => b.id);
}

export interface OwnerSummaryStats {
  activeListings: number;
  activeOffers: number;
  totalProfileViews: number;
  totalOfferImpressions: number;
}

// Active Listings/Offers reflect current status (not date-ranged); the two
// view/impression totals are deliberately all-time, per spec — the date
// range selector only ever scopes the trend sections below, not these cards.
export async function getOwnerSummaryStats(businessIds: string[]): Promise<OwnerSummaryStats> {
  if (businessIds.length === 0) {
    return { activeListings: 0, activeOffers: 0, totalProfileViews: 0, totalOfferImpressions: 0 };
  }

  const [activeListings, activeOffers, totalProfileViews, promotionIds] = await Promise.all([
    prisma.business.count({ where: { id: { in: businessIds }, status: "APPROVED" } }),
    prisma.promotion.count({
      where: { businessId: { in: businessIds }, status: "APPROVED", endDate: { gte: new Date() } },
    }),
    prisma.businessView.count({ where: { businessId: { in: businessIds } } }),
    prisma.promotion.findMany({ where: { businessId: { in: businessIds } }, select: { id: true } }),
  ]);

  const totalOfferImpressions = promotionIds.length
    ? await prisma.promotionEvent.count({
        where: { promotionId: { in: promotionIds.map((p) => p.id) }, eventType: "IMPRESSION" },
      })
    : 0;

  return { activeListings, activeOffers, totalProfileViews, totalOfferImpressions };
}

export async function getOwnerPromotionIds(businessIds: string[]): Promise<string[]> {
  if (businessIds.length === 0) return [];
  const rows = await prisma.promotion.findMany({ where: { businessId: { in: businessIds } }, select: { id: true } });
  return rows.map((r) => r.id);
}

export async function ownerHasAnyPromotion(ownerId: string): Promise<boolean> {
  const count = await prisma.promotion.count({ where: { submittedById: ownerId } });
  return count > 0;
}

export interface DailyViewPoint {
  date: string; // yyyy-mm-dd
  views: number;
}

export async function getProfileViewTrend(
  businessIds: string[],
  range: ResolvedDateRange
): Promise<{ points: DailyViewPoint[]; total: number }> {
  const days = eachDayIso(range.start, range.end);
  const counts = new Map(days.map((d) => [d, 0]));

  if (businessIds.length > 0) {
    const rows = await prisma.businessView.groupBy({
      by: ["viewDate"],
      where: { businessId: { in: businessIds }, viewDate: { gte: range.start, lte: range.end } },
      _count: { _all: true },
    });
    for (const row of rows) {
      const key = row.viewDate.toISOString().slice(0, 10);
      if (counts.has(key)) counts.set(key, row._count._all);
    }
  }

  const points = days.map((date) => ({ date, views: counts.get(date) ?? 0 }));
  const total = points.reduce((sum, p) => sum + p.views, 0);
  return { points, total };
}

export interface DailyPromotionEventPoint {
  date: string; // yyyy-mm-dd
  impressions: number;
  clicks: number;
}

export async function getPromotionEventTrend(
  promotionIds: string[],
  range: ResolvedDateRange
): Promise<{ points: DailyPromotionEventPoint[]; totalImpressions: number; totalClicks: number }> {
  const days = eachDayIso(range.start, range.end);
  const byDay = new Map(days.map((d) => [d, { impressions: 0, clicks: 0 }]));

  if (promotionIds.length > 0) {
    const rows = await prisma.promotionEvent.groupBy({
      by: ["eventDate", "eventType"],
      where: { promotionId: { in: promotionIds }, eventDate: { gte: range.start, lte: range.end } },
      _count: { _all: true },
    });
    for (const row of rows) {
      const key = row.eventDate.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      if (row.eventType === "IMPRESSION") bucket.impressions = row._count._all;
      else bucket.clicks = row._count._all;
    }
  }

  const points = days.map((date) => ({ date, ...byDay.get(date)! }));
  const totalImpressions = points.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = points.reduce((sum, p) => sum + p.clicks, 0);
  return { points, totalImpressions, totalClicks };
}
