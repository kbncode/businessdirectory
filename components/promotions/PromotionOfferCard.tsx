import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Megaphone } from "lucide-react";
import { formatMonthDay } from "@/lib/format";
import { DISCOUNT_TYPES } from "@/lib/promotion-details-schema";

type PromotionWithBusiness = Prisma.PromotionGetPayload<{
  include: { business: { select: { businessName: true; slug: true } } };
}>;

const TYPE_BADGE_LABEL: Record<string, string> = {
  OFFER: "OFFER",
  ADVERTISEMENT: "AD",
  CAMPAIGN: "CAMPAIGN",
};

const DISCOUNT_LABEL: Record<string, string> = Object.fromEntries(DISCOUNT_TYPES.map((d) => [d.value, d.label]));

function ImageArea({ promotion }: { promotion: PromotionWithBusiness }) {
  return (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-sand">
      {promotion.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Blob-hosted image, host not known ahead of time
        <img src={promotion.imageUrl} alt={promotion.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Megaphone className="h-8 w-8 text-stone" strokeWidth={1.75} />
        </div>
      )}
      <span className="absolute right-2 top-2 rounded-sm bg-sand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
        {TYPE_BADGE_LABEL[promotion.type]}
      </span>
    </div>
  );
}

function Highlight({ promotion }: { promotion: PromotionWithBusiness }) {
  const details = (promotion.details ?? {}) as Record<string, unknown>;

  if (promotion.type === "OFFER") {
    const discountValue = typeof details.discountValue === "string" ? details.discountValue : null;
    const discountType = typeof details.discountType === "string" ? DISCOUNT_LABEL[details.discountType] : null;
    return (
      <p className="font-display text-lg font-bold uppercase text-signalOrange">
        {discountValue ?? discountType ?? "Special offer"}
      </p>
    );
  }

  if (promotion.type === "ADVERTISEMENT") {
    const tagline = typeof details.tagline === "string" ? details.tagline : null;
    return tagline ? <p className="text-sm text-ink">{tagline}</p> : null;
  }

  const campaignTag = typeof details.campaignTag === "string" ? details.campaignTag : null;
  return campaignTag ? (
    <span className="inline-flex w-fit items-center rounded-sm bg-sand px-2 py-0.5 text-xs font-medium text-stone">
      {campaignTag}
    </span>
  ) : null;
}

function CardBody({ promotion, businessLink }: { promotion: PromotionWithBusiness; businessLink: boolean }) {
  const details = (promotion.details ?? {}) as Record<string, unknown>;

  return (
    <div className="flex flex-1 flex-col gap-1.5 p-4">
      <span className="font-display text-lg font-bold leading-snug text-ink">{promotion.title}</span>

      {businessLink ? (
        <Link
          href={`/business/${promotion.business.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="w-fit text-sm text-stone hover:text-ink hover:underline"
        >
          {promotion.business.businessName}
        </Link>
      ) : (
        <span className="text-sm text-stone">{promotion.business.businessName}</span>
      )}

      <Highlight promotion={promotion} />

      <p className="mt-auto text-xs text-stone">Ends {formatMonthDay(promotion.endDate)}</p>

      {promotion.type === "ADVERTISEMENT" && typeof details.ctaText === "string" && details.ctaText && (
        <Link
          href={typeof details.ctaLink === "string" && details.ctaLink ? details.ctaLink : `/business/${promotion.business.slug}`}
          target={typeof details.ctaLink === "string" && details.ctaLink ? "_blank" : undefined}
          rel={typeof details.ctaLink === "string" && details.ctaLink ? "noopener noreferrer" : undefined}
          className="mt-1 inline-flex w-fit items-center justify-center rounded-sm bg-signalOrange px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-signalOrange/90"
        >
          {details.ctaText}
        </Link>
      )}
    </div>
  );
}

export function PromotionOfferCard({ promotion }: { promotion: PromotionWithBusiness }) {
  const cardShell = "group flex flex-col overflow-hidden rounded-sm border border-sand bg-paper transition-shadow hover:shadow-md";

  // Advertisement cards aren't a single big link (the CTA button is the
  // actionable element instead) — Offer/Campaign cards are, per spec:
  // "clicking anywhere else on the card navigates to the business page."
  if (promotion.type === "ADVERTISEMENT") {
    return (
      <div className={cardShell}>
        <div className="h-1 w-full bg-transparent" />
        <ImageArea promotion={promotion} />
        <CardBody promotion={promotion} businessLink />
      </div>
    );
  }

  return (
    <Link href={`/business/${promotion.business.slug}`} className={cardShell}>
      <div className="h-1 w-full bg-transparent transition-colors group-hover:bg-signalOrange" />
      <ImageArea promotion={promotion} />
      <CardBody promotion={promotion} businessLink={false} />
    </Link>
  );
}
