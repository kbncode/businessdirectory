import { prisma } from "@/lib/prisma";

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
