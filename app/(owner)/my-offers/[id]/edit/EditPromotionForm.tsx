"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { PromotionType } from "@prisma/client";
import { FormField, fieldInputClass } from "@/components/ui/FormField";
import { buttonClasses } from "@/components/ui/Button";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";
import { PROMOTION_IMAGE_MAX_WIDTH } from "@/lib/promotion-constants";
import { DESCRIPTION_MAX, MAX_PROMOTION_DAYS, validatePromotionCommon } from "@/lib/promotion-validation";
import { DISCOUNT_TYPES } from "@/lib/promotion-details-schema";

// Matches PromotionOfferCard's aspect-[4/3] image box — same ratio the
// create form's crop modal exports at, so a re-cropped edit still lines up.
const PROMOTION_IMAGE_ASPECT_RATIO = 4 / 3;

interface EditPromotionFormProps {
  promotion: {
    id: string;
    type: PromotionType;
    title: string;
    description: string;
    imageUrl: string | null;
    startDate: string;
    endDate: string;
    details: Record<string, string>;
  };
}

const TYPE_LABEL: Record<PromotionType, string> = {
  OFFER: "Offer",
  ADVERTISEMENT: "Advertisement",
  CAMPAIGN: "Campaign",
};

export function EditPromotionForm({ promotion }: EditPromotionFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(promotion.title);
  const [description, setDescription] = useState(promotion.description);
  const [startDate, setStartDate] = useState(promotion.startDate);
  const [endDate, setEndDate] = useState(promotion.endDate);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(promotion.imageUrl);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [originalImageName, setOriginalImageName] = useState("image");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [offer, setOffer] = useState({
    discountType: promotion.details.discountType ?? "PERCENTAGE",
    discountValue: promotion.details.discountValue ?? "",
    promoCode: promotion.details.promoCode ?? "",
    minimumPurchase: promotion.details.minimumPurchase ?? "",
    terms: promotion.details.terms ?? "",
  });
  const [ad, setAd] = useState({
    tagline: promotion.details.tagline ?? "",
    ctaText: promotion.details.ctaText ?? "",
    ctaLink: promotion.details.ctaLink ?? "",
  });
  const [campaign, setCampaign] = useState({
    campaignTag: promotion.details.campaignTag ?? "",
    contactName: promotion.details.contactName ?? "",
    contactPhone: promotion.details.contactPhone ?? "",
    externalLink: promotion.details.externalLink ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [saved, setSaved] = useState(false);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageError(null);
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
    setImageRemoved(false);
    setCropModalOpen(false);
  }

  function handleImageCropCancel() {
    setCropModalOpen(false);
    if (!imageFile && imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const commonErrors = validatePromotionCommon({
      businessId: "placeholder", // businessId is fixed server-side; only used here to satisfy the shared validator's shape
      type: promotion.type,
      title,
      description,
      startDate,
      endDate,
    });
    if (Object.keys(commonErrors).length > 0) {
      setErrors(commonErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setToast(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    if (imageFile) formData.set("image", imageFile);
    if (imageRemoved) formData.set("removeImage", "true");

    const details = promotion.type === "OFFER" ? offer : promotion.type === "ADVERTISEMENT" ? ad : campaign;
    for (const [key, value] of Object.entries(details)) {
      formData.set(key, value);
    }

    try {
      const res = await fetch(`/api/my-offers/${promotion.id}`, { method: "PUT", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setToast({ message: data.error ?? "Something went wrong. Please try again.", tone: "error" });
        return;
      }

      setSaved(true);
    } catch {
      setToast({ message: "Something went wrong. Please try again.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col gap-4 rounded-sm border border-sand bg-paper p-6">
        <p className="text-sm text-ink">Your changes have been saved.</p>
        <button type="button" onClick={() => router.push("/my-offers")} className={buttonClasses("primary")}>
          Back to my offers
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="rounded-sm border border-sand bg-sand/20 px-4 py-3 text-sm text-stone">
        Type: <span className="font-medium text-ink">{TYPE_LABEL[promotion.type]}</span> — can&apos;t be changed
        after submission.
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Details</h2>

          <FormField label="Title" htmlFor="ep-title" required error={errors.title}>
            <input id="ep-title" className={fieldInputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>

          <FormField
            label="Description"
            htmlFor="ep-description"
            required
            error={errors.description}
            hint={`${description.length}/${DESCRIPTION_MAX}`}
          >
            <textarea
              id="ep-description"
              rows={4}
              maxLength={DESCRIPTION_MAX}
              className={fieldInputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <FormField
            label="Image"
            htmlFor="ep-image"
            error={imageError ?? undefined}
            hint="Optional. Max 3MB. JPG, PNG, or WebP. You'll crop it to fit the card after choosing a file."
          >
            <input
              id="ep-image"
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-signalOrange file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            />
            {imagePreview && (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL / Blob-hosted preview */}
                <img src={imagePreview} alt="Selected image preview" className="h-24 w-32 rounded-sm border border-sand object-cover" />
                <button type="button" onClick={() => setCropModalOpen(true)} className="text-xs font-medium text-ink underline">
                  Recrop
                </button>
                <button type="button" onClick={handleRemoveImage} className="text-xs font-medium text-rejectedRed underline">
                  Remove
                </button>
              </div>
            )}
          </FormField>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <FormField label="Start date" htmlFor="ep-start" required error={errors.startDate}>
                <input
                  id="ep-start"
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
                htmlFor="ep-end"
                required
                error={errors.endDate}
                hint={`Up to ${MAX_PROMOTION_DAYS} days after the start date`}
              >
                <input
                  id="ep-end"
                  type="date"
                  className={fieldInputClass}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </section>

        {promotion.type === "OFFER" && (
          <section className="flex flex-col gap-4 rounded-sm border border-sand bg-sand/20 p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Offer details</h2>

            <FormField label="Discount type" htmlFor="ep-discount-type" required error={errors.discountType}>
              <select
                id="ep-discount-type"
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
              htmlFor="ep-discount-value"
              required
              error={errors.discountValue}
              hint='e.g. "20% off" or "₹500 off"'
            >
              <input
                id="ep-discount-value"
                className={fieldInputClass}
                value={offer.discountValue}
                onChange={(e) => setOffer((prev) => ({ ...prev, discountValue: e.target.value }))}
              />
            </FormField>

            <FormField label="Promo code" htmlFor="ep-promo-code" error={errors.promoCode} hint="Optional">
              <input
                id="ep-promo-code"
                className={fieldInputClass}
                value={offer.promoCode}
                onChange={(e) => setOffer((prev) => ({ ...prev, promoCode: e.target.value }))}
              />
            </FormField>

            <FormField label="Minimum purchase" htmlFor="ep-min-purchase" error={errors.minimumPurchase} hint="Optional">
              <input
                id="ep-min-purchase"
                className={fieldInputClass}
                value={offer.minimumPurchase}
                onChange={(e) => setOffer((prev) => ({ ...prev, minimumPurchase: e.target.value }))}
              />
            </FormField>

            <FormField label="Terms & conditions" htmlFor="ep-terms" error={errors.terms} hint="Optional">
              <textarea
                id="ep-terms"
                rows={3}
                className={fieldInputClass}
                value={offer.terms}
                onChange={(e) => setOffer((prev) => ({ ...prev, terms: e.target.value }))}
              />
            </FormField>
          </section>
        )}

        {promotion.type === "ADVERTISEMENT" && (
          <section className="flex flex-col gap-4 rounded-sm border border-sand bg-sand/20 p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Advertisement details</h2>

            <FormField label="Tagline" htmlFor="ep-tagline" required error={errors.tagline}>
              <input
                id="ep-tagline"
                className={fieldInputClass}
                value={ad.tagline}
                onChange={(e) => setAd((prev) => ({ ...prev, tagline: e.target.value }))}
              />
            </FormField>

            <FormField
              label="CTA button text"
              htmlFor="ep-cta-text"
              required
              error={errors.ctaText}
              hint='e.g. "Visit Store" or "Call Now"'
            >
              <input
                id="ep-cta-text"
                className={fieldInputClass}
                value={ad.ctaText}
                onChange={(e) => setAd((prev) => ({ ...prev, ctaText: e.target.value }))}
              />
            </FormField>

            <FormField
              label="CTA link"
              htmlFor="ep-cta-link"
              error={errors.ctaLink}
              hint="Optional — defaults to this business's own listing page if left blank"
            >
              <input
                id="ep-cta-link"
                type="url"
                placeholder="https://example.com"
                className={fieldInputClass}
                value={ad.ctaLink}
                onChange={(e) => setAd((prev) => ({ ...prev, ctaLink: e.target.value }))}
              />
            </FormField>
          </section>
        )}

        {promotion.type === "CAMPAIGN" && (
          <section className="flex flex-col gap-4 rounded-sm border border-sand bg-sand/20 p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Campaign details</h2>

            <FormField
              label="Campaign tag"
              htmlFor="ep-campaign-tag"
              required
              error={errors.campaignTag}
              hint='e.g. "Community Drive" or "Seasonal Sale"'
            >
              <input
                id="ep-campaign-tag"
                className={fieldInputClass}
                value={campaign.campaignTag}
                onChange={(e) => setCampaign((prev) => ({ ...prev, campaignTag: e.target.value }))}
              />
            </FormField>

            <FormField label="Contact name" htmlFor="ep-contact-name" error={errors.contactName} hint="Optional">
              <input
                id="ep-contact-name"
                className={fieldInputClass}
                value={campaign.contactName}
                onChange={(e) => setCampaign((prev) => ({ ...prev, contactName: e.target.value }))}
              />
            </FormField>

            <FormField label="Contact phone" htmlFor="ep-contact-phone" error={errors.contactPhone} hint="Optional">
              <input
                id="ep-contact-phone"
                type="tel"
                className={fieldInputClass}
                value={campaign.contactPhone}
                onChange={(e) => setCampaign((prev) => ({ ...prev, contactPhone: e.target.value }))}
              />
            </FormField>

            <FormField label="External link" htmlFor="ep-external-link" error={errors.externalLink} hint="Optional">
              <input
                id="ep-external-link"
                type="url"
                placeholder="https://example.com"
                className={fieldInputClass}
                value={campaign.externalLink}
                onChange={(e) => setCampaign((prev) => ({ ...prev, externalLink: e.target.value }))}
              />
            </FormField>
          </section>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className={cn(buttonClasses("primary"), "disabled:opacity-60")}>
            {submitting ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={() => router.push("/my-offers")} className={buttonClasses("secondary")}>
            Cancel
          </button>
        </div>
      </form>

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
