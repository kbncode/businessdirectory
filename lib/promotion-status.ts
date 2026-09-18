import type { PromotionStatus } from "@prisma/client";

export type PromotionDisplayStatus = PromotionStatus;

interface PromotionLike {
  status: PromotionStatus;
  endDate: Date | string;
}

// EXPIRED is never written to the DB by anything in this flow — an
// APPROVED promotion that's simply run past its endDate stays APPROVED in
// storage (same pattern as Business.isFeatured: no cron flips a status,
// the query/display layer treats it as expired instead). This is the one
// place that "past endDate" fact gets turned into the EXPIRED label shown
// to the owner (and reused wherever else a promotion's status is judged).
export function getPromotionDisplayStatus(promotion: PromotionLike): PromotionDisplayStatus {
  if (promotion.status === "APPROVED" && new Date(promotion.endDate).getTime() < Date.now()) {
    return "EXPIRED";
  }
  return promotion.status;
}

// The spec's "active" definition: PENDING, or APPROVED and not yet past
// endDate. A REMOVED or REJECTED row, or an APPROVED one that's expired,
// never blocks a new submission.
export function isActivePromotion(promotion: PromotionLike): boolean {
  const displayStatus = getPromotionDisplayStatus(promotion);
  return displayStatus === "PENDING" || displayStatus === "APPROVED";
}
