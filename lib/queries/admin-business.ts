import type { Prisma, BusinessStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/cursor";
import type { CursorPage } from "@/lib/queries/business";

// Admin-facing business queries/mutations. Deliberately separate from
// lib/queries/business.ts, which only ever surfaces status: APPROVED rows
// to the public site — nothing here should be imported by public pages.

// Only what the pending-queue / listings-table rows actually render — not
// about/productsServices/brochureUrl/etc. The full record is only ever
// fetched by getBusinessForAdmin (the detail modal / edit form).
const ADMIN_LIST_SELECT = {
  id: true,
  businessName: true,
  ownerName: true,
  photoUrl: true,
  city: true,
  status: true,
  createdAt: true,
  isFeatured: true,
  featuredStartDate: true,
  featuredEndDate: true,
  mainCategory: { select: { name: true } },
  country: { select: { name: true } },
  state: { select: { name: true } },
} satisfies Prisma.BusinessSelect;

export async function getPendingBusinesses() {
  return prisma.business.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: ADMIN_LIST_SELECT,
  });
}

export async function getPendingCount() {
  return prisma.business.count({ where: { status: "PENDING" } });
}

export interface AdminListingFilters {
  status?: BusinessStatus;
  q?: string;
}

const ADMIN_LISTINGS_PAGE_SIZE = 20;

export type AdminListItem = Prisma.BusinessGetPayload<{ select: typeof ADMIN_LIST_SELECT }>;

export async function getAllBusinessesForAdmin(
  filters: AdminListingFilters,
  cursorToken?: string
): Promise<CursorPage<AdminListItem>> {
  const where: Prisma.BusinessWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.q) {
    where.OR = [
      { businessName: { contains: filters.q, mode: "insensitive" } },
      { ownerName: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const cursor = cursorToken ? decodeCursor(cursorToken) : null;
  if (cursor) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] },
    ];
  }

  const take = ADMIN_LISTINGS_PAGE_SIZE;
  const rows = await prisma.business.findMany({
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

export async function getBusinessForAdmin(id: string) {
  return prisma.business.findUnique({
    where: { id },
    include: {
      mainCategory: true,
      entity: true,
      type: true,
      country: true,
      state: true,
      submittedBy: { select: { email: true, name: true } },
      subCategories: { include: { subCategory: true } },
    },
  });
}

export async function approveBusiness(id: string) {
  return prisma.business.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), rejectionReason: null },
    include: { submittedBy: { select: { email: true, name: true } } },
  });
}

export async function rejectBusiness(id: string, reason: string) {
  return prisma.business.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason, approvedAt: null },
    include: { submittedBy: { select: { email: true, name: true } } },
  });
}

// "Unpublish" reuses REJECTED + a fixed rejectionReason rather than adding a
// new enum value — the public query already excludes anything not
// status: APPROVED, so this achieves the same outcome without a migration
// or a second status meaning roughly the same thing.
const UNPUBLISH_REASON = "Unpublished by admin";

export async function unpublishBusiness(id: string) {
  return rejectBusiness(id, UNPUBLISH_REASON);
}

export async function deleteBusiness(id: string) {
  return prisma.business.delete({ where: { id } });
}
