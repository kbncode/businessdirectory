import { notFound } from "next/navigation";
import Link from "next/link";
import { Megaphone, Phone, MapPin } from "lucide-react";
import { getPublicPromotionById } from "@/lib/queries/promotions";
import { DISCOUNT_TYPES } from "@/lib/promotion-details-schema";
import { formatDate } from "@/lib/format";

interface Props {
  params: { id: string };
}

const TYPE_BADGE_LABEL: Record<string, string> = {
  OFFER: "OFFER",
  ADVERTISEMENT: "AD",
  CAMPAIGN: "CAMPAIGN",
};

const DISCOUNT_LABEL: Record<string, string> = Object.fromEntries(DISCOUNT_TYPES.map((d) => [d.value, d.label]));

export default async function OfferDetailPage({ params }: Props) {
  const promotion = await getPublicPromotionById(params.id);
  if (!promotion) notFound();

  const details = (promotion.details ?? {}) as Record<string, unknown>;
  const str = (key: string) => (typeof details[key] === "string" && details[key] ? (details[key] as string) : null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="overflow-hidden rounded-sm border border-sand bg-paper">
        <div className="relative aspect-[4/3] w-full bg-sand">
          {promotion.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Blob-hosted image, host not known ahead of time
            <img src={promotion.imageUrl} alt={promotion.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Megaphone className="h-10 w-10 text-stone" strokeWidth={1.75} />
            </div>
          )}
          <span className="absolute right-3 top-3 rounded-sm bg-sand px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ink">
            {TYPE_BADGE_LABEL[promotion.type]}
          </span>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{promotion.title}</h1>
            <Link href={`/business/${promotion.business.slug}`} className="text-sm text-stone hover:text-ink hover:underline">
              {promotion.business.businessName}
            </Link>
          </div>

          {promotion.type === "OFFER" && (
            <div className="flex flex-col gap-2 rounded-sm border border-sand bg-sand/20 p-4">
              <p className="font-display text-xl font-bold uppercase text-signalOrange">
                {str("discountValue") ?? (str("discountType") ? DISCOUNT_LABEL[details.discountType as string] : "Special offer")}
              </p>
              {str("promoCode") && (
                <p className="text-sm text-ink">
                  Promo code: <span className="font-mono font-semibold">{str("promoCode")}</span>
                </p>
              )}
              {str("minimumPurchase") && <p className="text-sm text-stone">Minimum purchase: {str("minimumPurchase")}</p>}
              {str("terms") && <p className="text-xs text-stone">{str("terms")}</p>}
            </div>
          )}

          {promotion.type === "CAMPAIGN" && str("campaignTag") && (
            <span className="inline-flex w-fit items-center rounded-sm bg-sand px-2 py-0.5 text-xs font-medium text-stone">
              {str("campaignTag")}
            </span>
          )}

          <p className="text-sm text-ink">{promotion.description}</p>

          {promotion.type === "ADVERTISEMENT" && str("tagline") && (
            <p className="text-sm font-medium text-ink">{str("tagline")}</p>
          )}

          {promotion.type === "CAMPAIGN" && (str("contactName") || str("contactPhone")) && (
            <div className="flex flex-col gap-1 text-sm text-stone">
              {str("contactName") && <p>Contact: {str("contactName")}</p>}
              {str("contactPhone") && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {str("contactPhone")}
                </p>
              )}
            </div>
          )}

          {promotion.business.address && (
            <p className="flex items-center gap-1.5 text-xs text-stone">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
              {promotion.business.address}, {promotion.business.city}
            </p>
          )}

          <p className="text-xs text-stone">
            {formatDate(promotion.startDate)} – {formatDate(promotion.endDate)}
          </p>

          <div className="flex flex-wrap gap-3">
            {promotion.type === "ADVERTISEMENT" && str("ctaText") && (
              <Link
                href={str("ctaLink") ?? `/business/${promotion.business.slug}`}
                target={str("ctaLink") ? "_blank" : undefined}
                rel={str("ctaLink") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center justify-center rounded-sm bg-signalOrange px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-signalOrange/90"
              >
                {str("ctaText")}
              </Link>
            )}
            {promotion.type === "CAMPAIGN" && str("externalLink") && (
              <Link
                href={str("externalLink")!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-sm bg-signalOrange px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-signalOrange/90"
              >
                Learn more
              </Link>
            )}
            <Link
              href={`/business/${promotion.business.slug}`}
              className="inline-flex items-center justify-center rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand"
            >
              View business
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
