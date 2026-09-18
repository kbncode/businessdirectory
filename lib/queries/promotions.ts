import { prisma } from "@/lib/prisma";
import type { PromotionType } from "@prisma/client";
import { isActivePromotion } from "@/lib/promotion-status";

// Viewer-facing queries scoped to "the signed-in user's own businesses and
// promotions" — same ownership-scoping convention as lib/queries/my-listings.ts.

export async function getMyApprovedBusinesses(ownerId: string) {
  return prisma.business.findMany({
    where: { submittedById: ownerId, status: "APPROVED" },
    select: { id: true, slug: true, businessName: true, photoUrl: true },
    orderBy: { businessName: "asc" },
  });
}

// A business can have many PENDING/REJECTED/EXPIRED/REMOVED rows over time
// — only ever at most one "active" (PENDING, or APPROVED and not expired)
// at once, which is what this looks for.
export async function getActivePromotionForBusiness(businessId: string) {
  const candidates = await prisma.promotion.findMany({
    where: { businessId, status: { in: ["PENDING", "APPROVED"] } },
  });
  return candidates.find(isActivePromotion) ?? null;
}

export async function getMyPromotions(ownerId: string) {
  return prisma.promotion.findMany({
    where: { submittedById: ownerId },
    include: { business: { select: { businessName: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyPromotionById(id: string, ownerId: string) {
  const promotion = await prisma.promotion.findUnique({ where: { id } });
  if (!promotion || promotion.submittedById !== ownerId) return null;
  return promotion;
}

export interface CreatePromotionInput {
  businessId: string;
  submittedById: string;
  type: PromotionType;
  title: string;
  description: string;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date;
  details: object;
}

export async function createPromotion(input: CreatePromotionInput) {
  return prisma.promotion.create({ data: input });
}

export interface RemoveMyPromotionResult {
  ok: boolean;
  message?: string;
}

export async function removeMyPromotion(id: string, ownerId: string): Promise<RemoveMyPromotionResult> {
  const promotion = await getMyPromotionById(id, ownerId);
  if (!promotion) return { ok: false, message: "Promotion not found." };
  if (!isActivePromotion(promotion) || promotion.status !== "APPROVED") {
    return { ok: false, message: "Only an active, approved promotion can be removed." };
  }

  await prisma.promotion.update({ where: { id }, data: { status: "REMOVED", removedAt: new Date() } });
  return { ok: true };
}
