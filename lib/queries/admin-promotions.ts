import type { Prisma, PromotionStatus } from "@prisma/client";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/cursor";
import type { CursorPage } from "@/lib/queries/business";

// Admin-facing promotion queries/mutations. Same file organization as
// lib/queries/admin-business.ts — deliberately separate from
// lib/queries/promotions.ts (owner-scoped) and any future public reads.

const ADMIN_LIST_SELECT = {
  id: true,
  title: true,
  type: true,
  status: true,
  startDate: true,
  endDate: true,
  sortOrder: true,
  createdAt: true,
  approvedAt: true,
  removedAt: true,
  business: { select: { businessName: true, slug: true } },
} satisfies Prisma.PromotionSelect;

export type AdminPromotionListItem = Prisma.PromotionGetPayload<{ select: typeof ADMIN_LIST_SELECT }>;

export async function getPendingPromotions() {
  return prisma.promotion.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: ADMIN_LIST_SELECT,
  });
}

// Same rationale as admin-business.ts's getPendingCount: this renders on
// every admin page via the sidebar badge, so it's cached rather than
// hitting the DB on every navigation.
export const getPendingPromotionCount = unstable_cache(
  async () => prisma.promotion.count({ where: { status: "PENDING" } }),
  ["promotion-pending-count"],
  { tags: ["promotion-pending-count"], revalidate: 30 }
);

export interface AdminPromotionFilters {
  status?: PromotionStatus | "EXPIRED";
  q?: string;
}

export async function getAllPromotionsForAdmin(
  filters: AdminPromotionFilters,
  cursorToken?: string
): Promise<CursorPage<AdminPromotionListItem>> {
  // Each filter that needs its own OR clause pushes one AND'd sub-condition
  // here instead of writing where.OR directly — status/search/cursor can
  // all be active together, and a plain `where.OR = [...]` from a later
  // filter would silently clobber an earlier one's.
  const andConditions: Prisma.PromotionWhereInput[] = [];
  const where: Prisma.PromotionWhereInput = { AND: andConditions };

  // "Expired" means either: the cron has already flipped the stored status
  // to EXPIRED, or it hasn't run yet and the row is still sitting there as
  // APPROVED with a past endDate (lib/promotion-status.ts's
  // getPromotionDisplayStatus treats both the same for display) — the tab
  // has to catch both so a promotion doesn't briefly vanish from every tab
  // in the gap between it expiring and the next cron run.
  if (filters.status === "EXPIRED") {
    andConditions.push({ OR: [{ status: "EXPIRED" }, { status: "APPROVED", endDate: { lt: new Date() } }] });
  } else if (filters.status) {
    where.status = filters.status;
    if (filters.status === "APPROVED") {
      // The "Approved" tab means "currently live", matching the home page —
      // an expired one shows under the Expired tab instead, not here too.
      where.endDate = { gte: new Date() };
    }
  }

  if (filters.q) {
    andConditions.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { business: { businessName: { contains: filters.q, mode: "insensitive" } } },
      ],
    });
  }

  const cursor = cursorToken ? decodeCursor(cursorToken) : null;
  if (cursor) {
    andConditions.push({
      OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
    });
  }

  const take = 20;
  const rows = await prisma.promotion.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    select: ADMIN_LIST_SELECT,
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function getPromotionForAdmin(id: string) {
  return prisma.promotion.findUnique({
    where: { id },
    include: {
      business: { select: { businessName: true, slug: true } },
      submittedBy: { select: { email: true, name: true } },
    },
  });
}

export async function approvePromotion(id: string) {
  const promotion = await prisma.promotion.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), rejectionReason: null },
    include: { business: { select: { businessName: true, slug: true } }, submittedBy: { select: { email: true } } },
  });
  revalidateTag("promotion-pending-count");
  return promotion;
}

export async function rejectPromotion(id: string, reason: string) {
  const promotion = await prisma.promotion.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason },
    include: { business: { select: { businessName: true, slug: true } }, submittedBy: { select: { email: true } } },
  });
  revalidateTag("promotion-pending-count");
  return promotion;
}

// Admin's "Remove from home page" — same effect as the owner's own removal
// (lib/queries/promotions.ts's removeMyPromotion), just reachable for any
// currently-active promotion, any time, any reason, not only the owner's.
export async function removePromotionAsAdmin(id: string) {
  return prisma.promotion.update({ where: { id }, data: { status: "REMOVED", removedAt: new Date() } });
}

export async function updatePromotionSortOrder(id: string, sortOrder: number | null) {
  return prisma.promotion.update({ where: { id }, data: { sortOrder } });
}
