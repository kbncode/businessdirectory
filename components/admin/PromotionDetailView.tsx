import { Badge } from "@/components/ui/Badge";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { PromotionStatusBadge } from "@/components/promotions/PromotionStatusBadge";
import { PROMOTION_TYPES } from "@/lib/promotion-validation";
import { DISCOUNT_TYPES } from "@/lib/promotion-details-schema";
import { formatDate, formatDateTime } from "@/lib/format";
import type { getPromotionForAdmin } from "@/lib/queries/admin-promotions";

type Promotion = NonNullable<Awaited<ReturnType<typeof getPromotionForAdmin>>>;

const TYPE_LABEL: Record<string, string> = Object.fromEntries(PROMOTION_TYPES.map((t) => [t.value, t.label]));
const DISCOUNT_LABEL: Record<string, string> = Object.fromEntries(DISCOUNT_TYPES.map((d) => [d.value, d.label]));

const DETAIL_FIELD_LABELS: Record<string, Record<string, string>> = {
  OFFER: {
    discountType: "Discount type",
    discountValue: "Discount value",
    promoCode: "Promo code",
    minimumPurchase: "Minimum purchase",
    terms: "Terms & conditions",
  },
  ADVERTISEMENT: {
    tagline: "Tagline",
    ctaText: "CTA button text",
    ctaLink: "CTA link",
  },
  CAMPAIGN: {
    campaignTag: "Campaign tag",
    contactName: "Contact name",
    contactPhone: "Contact phone",
    externalLink: "External link",
  },
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-ink">{value}</dd>
    </div>
  );
}

export function PromotionDetailView({ promotion }: { promotion: Promotion }) {
  const details = (promotion.details ?? {}) as Record<string, unknown>;
  const labels = DETAIL_FIELD_LABELS[promotion.type] ?? {};

  return (
    <div className="flex flex-col gap-6 text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-ink">{promotion.title}</h3>
          <p className="text-sm text-stone">
            {promotion.business.businessName} &middot; Submitted by{" "}
            {promotion.submittedBy.name ?? promotion.submittedBy.email} &middot; {formatDateTime(promotion.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="category">{TYPE_LABEL[promotion.type]}</Badge>
          <PromotionStatusBadge status={promotion.status} endDate={promotion.endDate} />
        </div>
      </div>

      {promotion.rejectionReason && (
        <div className="rounded-sm border border-rejectedRed/30 bg-rejectedRed/10 p-3 text-sm text-rejectedRed">
          <strong>Rejection reason:</strong> {promotion.rejectionReason}
        </div>
      )}

      {promotion.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- Blob-hosted image, host not known ahead of time
        <img
          src={promotion.imageUrl}
          alt={promotion.title}
          className="h-48 w-full rounded-sm border border-sand object-cover"
        />
      )}

      <SectionDivider />

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Start date" value={formatDate(promotion.startDate)} />
        <Field label="End date" value={formatDate(promotion.endDate)} />
      </dl>

      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-stone">Description</dt>
        <dd className="mt-0.5 whitespace-pre-line text-sm text-ink">{promotion.description}</dd>
      </div>

      <SectionDivider />

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(labels).map(([key, label]) => {
          const raw = details[key];
          const value = key === "discountType" && typeof raw === "string" ? DISCOUNT_LABEL[raw] ?? raw : raw;
          return <Field key={key} label={label} value={typeof value === "string" || typeof value === "number" ? value : null} />;
        })}
      </dl>
    </div>
  );
}
