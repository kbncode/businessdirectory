import { z } from "zod";
import type { PromotionType } from "@prisma/client";

// The `details` JSON column's shape depends on `type` — Prisma can't
// express that, so it's validated here instead, once, shared by the API
// route (server truth) and reused for typing the form's own state.

export const DISCOUNT_TYPES = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FLAT_AMOUNT", label: "Flat amount" },
  { value: "BOGO", label: "Buy One Get One" },
  { value: "FREE_GIFT", label: "Free gift" },
  { value: "OTHER", label: "Other" },
] as const;

const urlOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Enter a full URL, e.g. https://example.com");

export const offerDetailsSchema = z.object({
  discountType: z.enum(["PERCENTAGE", "FLAT_AMOUNT", "BOGO", "FREE_GIFT", "OTHER"], {
    error: "Choose a discount type.",
  }),
  discountValue: z.string().trim().min(1, "Discount value is required."),
  promoCode: z.string().trim().optional(),
  minimumPurchase: z.string().trim().optional(),
  terms: z.string().trim().optional(),
});

export const advertisementDetailsSchema = z.object({
  tagline: z.string().trim().min(1, "Tagline is required."),
  ctaText: z.string().trim().min(1, "CTA button text is required."),
  ctaLink: urlOrEmpty.optional().default(""),
});

export const campaignDetailsSchema = z.object({
  campaignTag: z.string().trim().min(1, "Campaign tag is required."),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  externalLink: urlOrEmpty.optional().default(""),
});

export type OfferDetails = z.infer<typeof offerDetailsSchema>;
export type AdvertisementDetails = z.infer<typeof advertisementDetailsSchema>;
export type CampaignDetails = z.infer<typeof campaignDetailsSchema>;
export type PromotionDetails = OfferDetails | AdvertisementDetails | CampaignDetails;

export function getDetailsSchema(type: PromotionType) {
  switch (type) {
    case "OFFER":
      return offerDetailsSchema;
    case "ADVERTISEMENT":
      return advertisementDetailsSchema;
    case "CAMPAIGN":
      return campaignDetailsSchema;
  }
}
