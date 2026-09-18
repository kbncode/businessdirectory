// Pure validation logic for the common (non-type-specific) Promotion
// fields, no Node-only or browser-only APIs — same client-form/server-route
// dual use as business-form-validation.ts / event-validation.ts. The
// type-specific `details` JSON is validated separately, with Zod, in
// lib/promotion-details-schema.ts (as specced).

export const PROMOTION_TYPES = [
  { value: "OFFER", label: "Offer", description: "A discount or deal" },
  { value: "ADVERTISEMENT", label: "Advertisement", description: "Promote your business or a product" },
  { value: "CAMPAIGN", label: "Campaign", description: "A community initiative or event-style promotion" },
] as const;

export const DESCRIPTION_MAX = 300;
export const MAX_PROMOTION_DAYS = 90;

export interface PromotionCommonValues {
  businessId: string;
  type: "OFFER" | "ADVERTISEMENT" | "CAMPAIGN";
  title: string;
  description: string;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
}

export type PromotionCommonErrors = Partial<Record<keyof PromotionCommonValues, string>>;

export function validatePromotionCommon(values: PromotionCommonValues): PromotionCommonErrors {
  const errors: PromotionCommonErrors = {};

  if (!values.businessId) {
    errors.businessId = "Choose a business.";
  }
  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }
  if (!values.description.trim()) {
    errors.description = "Description is required.";
  } else if (values.description.length > DESCRIPTION_MAX) {
    errors.description = `Keep it under ${DESCRIPTION_MAX} characters.`;
  }

  const start = values.startDate ? new Date(values.startDate) : null;
  const end = values.endDate ? new Date(values.endDate) : null;

  if (!start || Number.isNaN(start.getTime())) {
    errors.startDate = "Start date is required.";
  }
  if (!end || Number.isNaN(end.getTime())) {
    errors.endDate = "End date is required.";
  }

  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    if (end.getTime() <= start.getTime()) {
      errors.endDate = "End date must be after the start date.";
    } else {
      const maxEnd = new Date(start);
      maxEnd.setDate(maxEnd.getDate() + MAX_PROMOTION_DAYS);
      if (end.getTime() > maxEnd.getTime()) {
        errors.endDate = `A promotion can run for at most ${MAX_PROMOTION_DAYS} days.`;
      }
    }
  }

  return errors;
}
