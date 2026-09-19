"use client";

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField, fieldInputClass } from "@/components/ui/FormField";
import { buttonClasses } from "@/components/ui/Button";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";
import { PROMOTION_IMAGE_MAX_WIDTH } from "@/lib/promotion-constants";

// Matches the aspect-[4/3] box PromotionOfferCard renders images in — the
// crop modal exports at that same ratio so what the owner approves here is
// exactly what visitors see, not re-cropped a second time by object-cover.
const PROMOTION_IMAGE_ASPECT_RATIO = 4 / 3;
import { PROMOTION_TYPES, DESCRIPTION_MAX, MAX_PROMOTION_DAYS, validatePromotionCommon } from "@/lib/promotion-validation";
import { DISCOUNT_TYPES } from "@/lib/promotion-details-schema";
import type { getMyApprovedBusinesses } from "@/lib/queries/promotions";

type ApprovedBusiness = Awaited<ReturnType<typeof getMyApprovedBusinesses>>[number];
type PromotionType = "OFFER" | "ADVERTISEMENT" | "CAMPAIGN";

interface PromotionFormProps {
  businesses: ApprovedBusiness[];
  activeBusinessIds: string[];
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_OFFER = { discountType: "PERCENTAGE", discountValue: "", promoCode: "", minimumPurchase: "", terms: "" };
const EMPTY_AD = { tagline: "", ctaText: "", ctaLink: "" };
const EMPTY_CAMPAIGN = { campaignTag: "", contactName: "", contactPhone: "", externalLink: "" };

export function PromotionForm({ businesses, activeBusinessIds }: PromotionFormProps) {
  const router = useRouter();
  const activeSet = useMemo(() => new Set(activeBusinessIds), [activeBusinessIds]);

  const [businessId, setBusinessId] = useState(businesses.length === 1 ? businesses[0].id : "");
  const [type, setType] = useState<PromotionType>("OFFER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(todayValue());
  const [endDate, setEndDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  // A raw upload is never accepted as-is — it always goes through the crop
  // modal first, same mandatory-crop pattern as hero images and business
  // listing photos.
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [originalImageName, setOriginalImageName] = useState("image");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [offer, setOffer] = useState(EMPTY_OFFER);
  const [ad, setAd] = useState(EMPTY_AD);
  const [campaign, setCampaign] = useState(EMPTY_CAMPAIGN);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [submitted, setSubmitted] = useState<PromotionType | null>(null);

  const selectedBusiness = businesses.find((b) => b.id === businessId);
  const blocked = businessId !== "" && activeSet.has(businessId);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageError(null);
    setImageFile(null);
    setImagePreview(null);
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("File must be JPG, PNG, or WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setImageError("File must be 3MB or smaller.");
      event.target.value = "";
      return;
    }

    setOriginalImageName(file.name);
    setOriginalImageSrc(URL.createObjectURL(file));
    setCropModalOpen(true);
  }

  function handleImageCropped(file: File, previewUrl: string) {
    setImageFile(file);
    setImagePreview(previewUrl);
    setCropModalOpen(false);
  }

  function handleImageCropCancel() {
    setCropModalOpen(false);
    if (!imageFile && imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (blocked) return;

    const commonErrors = validatePromotionCommon({ businessId, type, title, description, startDate, endDate });
    if (Object.keys(commonErrors).length > 0) {
      setErrors(commonErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setToast(null);

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("type", type);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    if (imageFile) formData.set("image", imageFile);

    const details = type === "OFFER" ? offer : type === "ADVERTISEMENT" ? ad : campaign;
    for (const [key, value] of Object.entries(details)) {
      formData.set(key, value);
    }

    try {
      const res = await fetch("/api/my-offers", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setToast({ message: data.error ?? "Something went wrong. Please try again.", tone: "error" });
        return;
      }

      setSubmitted(type);
    } catch {
      setToast({ message: "Something went wrong. Please try again.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const label = submitted === "OFFER" ? "offer" : submitted === "ADVERTISEMENT" ? "ad" : "campaign";
    return (
      <div className="flex flex-col gap-4 rounded-sm border border-sand bg-paper p-6">
        <p className="text-sm text-ink">Your {label} has been submitted for review.</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push("/my-offers")} className={buttonClasses("primary")}>
            View my offers
          </button>
          <button type="button" onClick={() => router.push("/profile")} className={buttonClasses("secondary")}>
            Back to profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {/* ---------- Step 1: business ---------- */}
      {businesses.length > 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">1. Business</h2>
          <div className="flex flex-col gap-2">
            {businesses.map((b) => (
              <label
                key={b.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-sm border p-3 text-sm transition-colors",
                  businessId === b.id ? "border-signalOrange bg-signalOrange/5" : "border-sand hover:bg-sand/20"
                )}
              >
                <input
                  type="radio"
                  name="business"
                  checked={businessId === b.id}
                  onChange={() => setBusinessId(b.id)}
                  className="h-4 w-4 border-ink text-signalOrange focus:ring-signalOrange"
                />
                <span className="text-ink">{b.businessName}</span>
                {activeSet.has(b.id) && <span className="ml-auto text-xs text-stone">Has an active promotion</span>}
              </label>
            ))}
          </div>
          {errors.businessId && <p className="text-sm text-rejectedRed">{errors.businessId}</p>}
        </section>
      )}

      {blocked && selectedBusiness && (
        <div className="rounded-sm border border-sand bg-sand/30 px-4 py-3 text-sm text-ink">
          <strong>{selectedBusiness.businessName}</strong> already has an active promotion. You can submit a new one
          once it ends, is rejected, or you remove it.
        </div>
      )}

      {businessId && !blocked && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* ---------- Step 2: type ---------- */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">
              {businesses.length > 1 ? "2. Type" : "1. Type"}
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PROMOTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    "rounded-sm border p-3 text-left transition-colors",
                    type === t.value ? "border-signalOrange bg-signalOrange/5" : "border-sand hover:bg-sand/20"
                  )}
                >
                  <p className="font-display text-sm font-bold text-ink">{t.label}</p>
                  <p className="mt-0.5 text-xs text-stone">{t.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ---------- Common fields ---------- */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">
              {businesses.length > 1 ? "3." : "2."} Details
            </h2>

            <FormField label="Title" htmlFor="po-title" required error={errors.title}>
              <input id="po-title" className={fieldInputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>

            <FormField
              label="Description"
              htmlFor="po-description"
              required
              error={errors.description}
              hint={`${description.length}/${DESCRIPTION_MAX}`}
            >
              <textarea
                id="po-description"
                rows={4}
                maxLength={DESCRIPTION_MAX}
                className={fieldInputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>

            <FormField
              label="Image"
              htmlFor="po-image"
              error={imageError ?? undefined}
              hint="Optional. Max 3MB. JPG, PNG, or WebP. You'll crop it to fit the card after choosing a file."
            >
              <input
                id="po-image"
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-signalOrange file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
              />
              {imagePreview && (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                  <img src={imagePreview} alt="Selected image preview" className="h-24 w-32 rounded-sm border border-sand object-cover" />
                  <button
                    type="button"
                    onClick={() => setCropModalOpen(true)}
                    className="text-xs font-medium text-ink underline"
                  >
                    Recrop
                  </button>
                </div>
              )}
            </FormField>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <FormField label="Start date" htmlFor="po-start" required error={errors.startDate}>
                  <input
                    id="po-start"
                    type="date"
                    className={fieldInputClass}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField
                  label="End date"
                  htmlFor="po-end"
                  required
                  error={errors.endDate}
                  hint={`Up to ${MAX_PROMOTION_DAYS} days after the start date`}
                >
                  <input
                    id="po-end"
                    type="date"
                    className={fieldInputClass}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </section>

          {/* ---------- Type-specific fields ---------- */}
          {type === "OFFER" && (
            <section className="flex flex-col gap-4 rounded-sm border border-sand bg-sand/20 p-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Offer details</h2>

              <FormField label="Discount type" htmlFor="po-discount-type" required error={errors.discountType}>
                <select
                  id="po-discount-type"
                  className={fieldInputClass}
                  value={offer.discountType}
                  onChange={(e) => setOffer((prev) => ({ ...prev, discountType: e.target.value }))}
                >
                  {DISCOUNT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Discount value"
                htmlFor="po-discount-value"
                required
                error={errors.discountValue}
                hint='e.g. "20% off" or "₹500 off"'
              >
                <input
                  id="po-discount-value"
                  className={fieldInputClass}
                  value={offer.discountValue}
                  onChange={(e) => setOffer((prev) => ({ ...prev, discountValue: e.target.value }))}
                />
              </FormField>

              <FormField label="Promo code" htmlFor="po-promo-code" error={errors.promoCode} hint="Optional">
                <input
                  id="po-promo-code"
                  className={fieldInputClass}
                  value={offer.promoCode}
                  onChange={(e) => setOffer((prev) => ({ ...prev, promoCode: e.target.value }))}
                />
              </FormField>

              <FormField label="Minimum purchase" htmlFor="po-min-purchase" error={errors.minimumPurchase} hint="Optional">
                <input
                  id="po-min-purchase"
                  className={fieldInputClass}
                  value={offer.minimumPurchase}
                  onChange={(e) => setOffer((prev) => ({ ...prev, minimumPurchase: e.target.value }))}
                />
              </FormField>

              <FormField label="Terms & conditions" htmlFor="po-terms" error={errors.terms} hint="Optional">
                <textarea
                  id="po-terms"
                  rows={3}
                  className={fieldInputClass}
                  value={offer.terms}
                  onChange={(e) => setOffer((prev) => ({ ...prev, terms: e.target.value }))}
                />
              </FormField>
            </section>
          )}

          {type === "ADVERTISEMENT" && (
            <section className="flex flex-col gap-4 rounded-sm border border-sand bg-sand/20 p-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Advertisement details</h2>

              <FormField label="Tagline" htmlFor="po-tagline" required error={errors.tagline}>
                <input
                  id="po-tagline"
                  className={fieldInputClass}
                  value={ad.tagline}
                  onChange={(e) => setAd((prev) => ({ ...prev, tagline: e.target.value }))}
                />
              </FormField>

              <FormField
                label="CTA button text"
                htmlFor="po-cta-text"
                required
                error={errors.ctaText}
                hint='e.g. "Visit Store" or "Call Now"'
              >
                <input
                  id="po-cta-text"
                  className={fieldInputClass}
                  value={ad.ctaText}
                  onChange={(e) => setAd((prev) => ({ ...prev, ctaText: e.target.value }))}
                />
              </FormField>

              <FormField
                label="CTA link"
                htmlFor="po-cta-link"
                error={errors.ctaLink}
                hint="Optional — defaults to this business's own listing page if left blank"
              >
                <input
                  id="po-cta-link"
                  type="url"
                  placeholder="https://example.com"
                  className={fieldInputClass}
                  value={ad.ctaLink}
                  onChange={(e) => setAd((prev) => ({ ...prev, ctaLink: e.target.value }))}
                />
              </FormField>
            </section>
          )}

          {type === "CAMPAIGN" && (
            <section className="flex flex-col gap-4 rounded-sm border border-sand bg-sand/20 p-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Campaign details</h2>

              <FormField
                label="Campaign tag"
                htmlFor="po-campaign-tag"
                required
                error={errors.campaignTag}
                hint='e.g. "Community Drive" or "Seasonal Sale"'
              >
                <input
                  id="po-campaign-tag"
                  className={fieldInputClass}
                  value={campaign.campaignTag}
                  onChange={(e) => setCampaign((prev) => ({ ...prev, campaignTag: e.target.value }))}
                />
              </FormField>

              <FormField label="Contact name" htmlFor="po-contact-name" error={errors.contactName} hint="Optional">
                <input
                  id="po-contact-name"
                  className={fieldInputClass}
                  value={campaign.contactName}
                  onChange={(e) => setCampaign((prev) => ({ ...prev, contactName: e.target.value }))}
                />
              </FormField>

              <FormField label="Contact phone" htmlFor="po-contact-phone" error={errors.contactPhone} hint="Optional">
                <input
                  id="po-contact-phone"
                  type="tel"
                  className={fieldInputClass}
                  value={campaign.contactPhone}
                  onChange={(e) => setCampaign((prev) => ({ ...prev, contactPhone: e.target.value }))}
                />
              </FormField>

              <FormField label="External link" htmlFor="po-external-link" error={errors.externalLink} hint="Optional">
                <input
                  id="po-external-link"
                  type="url"
                  placeholder="https://example.com"
                  className={fieldInputClass}
                  value={campaign.externalLink}
                  onChange={(e) => setCampaign((prev) => ({ ...prev, externalLink: e.target.value }))}
                />
              </FormField>
            </section>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={cn(buttonClasses("primary"), "self-start disabled:opacity-60")}
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </button>
        </form>
      )}

      {cropModalOpen && originalImageSrc && (
        <ImageCropModal
          imageSrc={originalImageSrc}
          fileName={originalImageName}
          aspectRatio={PROMOTION_IMAGE_ASPECT_RATIO}
          outputWidth={PROMOTION_IMAGE_MAX_WIDTH}
          onCancel={handleImageCropCancel}
          onCropped={handleImageCropped}
        />
      )}
    </div>
  );
}
