import type { Prisma, PromotionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isActivePromotion } from "@/lib/promotion-status";

// Viewer-facing queries scoped to "the signed-in user's own businesses and
// promotions" — same ownership-scoping convention as lib/queries/my-listings.ts.

// The one and only place a promotion's public visibility rule is expressed.
// This is the *primary* enforcement of "an expired promotion never appears"
// — it's a live filter, independent of whatever the stored `status` value
// currently says. The daily cron (app/api/cron/expire-promotions) only
// exists to keep the *stored* status tidy for admin's benefit; it is never
// what makes an expired promotion stop showing publicly.
//
// A function, not a static object — `new Date()` has to be evaluated fresh
// on every call. A module-level constant would capture "now" once at
// import/cold-start time and then silently go stale for the lifetime of
// that serverless instance.
export function getPublishedPromotionWhere(): Prisma.PromotionWhereInput {
  return { status: "APPROVED", endDate: { gte: new Date() } };
}

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

// Same ownership scoping as getMyPromotionById, plus the business name —
// the edit page shows it as read-only context (business/type are fixed on
// edit, never switchable).
export async function getMyEditablePromotionById(id: string, ownerId: string) {
  const promotion = await prisma.promotion.findUnique({
    where: { id },
    include: { business: { select: { businessName: true } } },
  });
  if (!promotion || promotion.submittedById !== ownerId) return null;
  if (!isActivePromotion(promotion)) return null;
  return promotion;
}

// The public offer detail page a promotion card's click target lands on.
// Reuses getPublishedPromotionWhere() as the *only* visibility rule (same
// reasoning as getFeaturedOffers) — an expired/pending/rejected/removed
// promotion's id simply 404s here, it doesn't leak details.
export async function getPublicPromotionById(id: string) {
  return prisma.promotion.findFirst({
    where: { id, ...getPublishedPromotionWhere() },
    include: {
      business: { select: { businessName: true, slug: true, businessPhone: true, city: true, address: true } },
    },
  });
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

// Home page "Featured Offers" — see getPublishedPromotionWhere for why
// expired rows are excluded by a live filter rather than trusting `status`.
export async function getFeaturedOffers(limit = 8) {
  return prisma.promotion.findMany({
    where: getPublishedPromotionWhere(),
    // sortOrder is nullable — Prisma orders nulls last by default for
    // "asc" on Postgres only when told to; being explicit here rather than
    // relying on that default.
    orderBy: [{ sortOrder: { sort: "asc", nulls: "last" } }, { approvedAt: "desc" }],
    take: limit,
    include: { business: { select: { businessName: true, slug: true } } },
  });
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

export interface UpdateMyPromotionInput {
  title: string;
  description: string;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date;
  details: object;
}

// businessId and type are deliberately never part of this input — an edit
// changes the promotion's own fields only, same convention as the business
// listing edit flow (RegisterForm mode="owner-edit"), and publishes
// immediately with no re-review, whatever the current status (PENDING
// stays PENDING, APPROVED stays APPROVED and stays live).
export async function updateMyPromotion(id: string, input: UpdateMyPromotionInput) {
  return prisma.promotion.update({ where: { id }, data: input });
}
