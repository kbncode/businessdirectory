import { prisma } from "@/lib/prisma";
import { eachDayIso, resolveDateRange, type ResolvedDateRange, type DateRangePreset } from "@/lib/date-range";

export { type DateRangePreset, resolveDateRange };

export async function getDashboardStats() {
  const [approvedCount, pendingCount, rejectedCount, viewerCount] = await Promise.all([
    prisma.business.count({ where: { status: "APPROVED" } }),
    prisma.business.count({ where: { status: "PENDING" } }),
    prisma.business.count({ where: { status: "REJECTED" } }),
    prisma.user.count(),
  ]);

  return { approvedCount, pendingCount, rejectedCount, viewerCount };
}

export interface BreakdownItem {
  label: string;
  count: number;
}

export async function getTopMainCategories(limit = 10): Promise<BreakdownItem[]> {
  const groups = await prisma.business.groupBy({
    by: ["mainCategoryId"],
    _count: { mainCategoryId: true },
    orderBy: { _count: { mainCategoryId: "desc" } },
    take: limit,
  });

  const categories = await prisma.businessMainCategory.findMany({
    where: { id: { in: groups.map((g) => g.mainCategoryId) } },
  });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  return groups.map((g) => ({
    label: nameById.get(g.mainCategoryId) ?? g.mainCategoryId,
    count: g._count.mainCategoryId,
  }));
}

export async function getTopCities(limit = 10): Promise<BreakdownItem[]> {
  const groups = await prisma.business.groupBy({
    by: ["city"],
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take: limit,
  });

  return groups.map((g) => ({ label: g.city, count: g._count.city }));
}

export interface ActiveViewerCounts {
  last24h: number;
  last15Days: number;
  last30Days: number;
}

// "Active" = has logged in within the window — a bigger number means more
// engagement, not more staleness. Counts overlap by design (anyone active
// in the last 24h is also counted in the 15/30-day buckets), same as any
// standard DAU/WAU/MAU-style rollup.
export async function getActiveViewerCounts(): Promise<ActiveViewerCounts> {
  const now = Date.now();
  const cutoff24h = new Date(now - 24 * 60 * 60 * 1000);
  const cutoff15d = new Date(now - 15 * 24 * 60 * 60 * 1000);
  const cutoff30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [last24h, last15Days, last30Days] = await Promise.all([
    prisma.user.count({ where: { lastLoginAt: { gte: cutoff24h } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: cutoff15d } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: cutoff30d } } }),
  ]);

  return { last24h, last15Days, last30Days };
}

// "Live" is approximated as "active within the last 5 minutes" — see
// lib/viewer-activity.ts for how lastActiveAt gets kept fresh while a
// viewer is browsing. Not a precise concurrent-session count (there's no
// server-side session store with JWT auth), just a presence signal.
const LIVE_WINDOW_MS = 5 * 60 * 1000;

export async function getLiveViewerCount(): Promise<number> {
  const cutoff = new Date(Date.now() - LIVE_WINDOW_MS);
  return prisma.user.count({ where: { lastActiveAt: { gte: cutoff } } });
}

export interface DailySiteVisitPoint {
  date: string; // yyyy-mm-dd
  visits: number;
}

export async function getSiteVisitorTrend(
  range: ResolvedDateRange
): Promise<{ points: DailySiteVisitPoint[]; total: number }> {
  const days = eachDayIso(range.start, range.end);
  const counts = new Map(days.map((d) => [d, 0]));

  const rows = await prisma.siteVisit.groupBy({
    by: ["viewDate"],
    where: { viewDate: { gte: range.start, lte: range.end } },
    _count: { _all: true },
  });
  for (const row of rows) {
    const key = row.viewDate.toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, row._count._all);
  }

  const points = days.map((date) => ({ date, visits: counts.get(date) ?? 0 }));
  const total = points.reduce((sum, p) => sum + p.visits, 0);
  return { points, total };
}
