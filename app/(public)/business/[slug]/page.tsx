import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Building2, CalendarDays, Store } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { BusinessDetailTabs } from "@/components/business/BusinessDetailTabs";
import { formatBusinessLocation, truncate } from "@/lib/format";
import { getApprovedBusinessBySlug } from "@/lib/queries/business";
import { getViewerSession } from "@/lib/auth";

// ISR: served from cache for up to 5 minutes between visits. Admin
// approve/edit/reject actions also call revalidatePath() for this route
// directly, so published changes show up immediately instead of waiting
// out the timer.
export const revalidate = 300;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const business = await getApprovedBusinessBySlug(params.slug);
  // generateMetadata runs before the page body streams, so the 404 must be
  // thrown here too — otherwise Next commits a 200 status before the page
  // component's own notFound() call ever registers.
  if (!business) notFound();

  return {
    title: business.businessName,
    description: business.about ? truncate(business.about, 160) : undefined,
  };
}

export default async function BusinessDetailPage({ params }: Props) {
  const business = await getApprovedBusinessBySlug(params.slug);
  if (!business) notFound();

  const session = await getViewerSession();
  const isOwner = session?.user?.id === business.submittedById;

  const location = [business.area, formatBusinessLocation(business)].filter(Boolean).join(", ");
  const socialLinks = business.socialLinks
    ? business.socialLinks
        .split(/[\n,]+/)
        .map((link) => link.trim())
        .filter(Boolean)
    : [];

  return (
    <div>
      {/* ---------- Header ---------- */}
      <section className="bg-paper py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-48 w-48 shrink-0 overflow-hidden rounded-sm border border-sand bg-sand shadow-sm sm:h-56 sm:w-56">
              {business.photoUrl ? (
                // object-cover auto-crops to fill the box (center-cropped) —
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, host not known ahead of time
                <img
                  src={business.photoUrl}
                  alt={business.businessName}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-stone/30 bg-paper">
                    <Store className="h-6 w-6 text-stone" strokeWidth={1.75} />
                  </span>
                  <span className="font-body text-xs text-stone">
                    {business.businessName.charAt(0).toUpperCase()} &middot; KBN
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                    {business.businessName}
                  </h1>
                  <p className="mt-1 text-sm text-stone">Owner: {business.ownerName}</p>
                </div>

                {isOwner && (
                  <Link href={`/my-listings/${business.id}/edit`} className={buttonClasses("secondary")}>
                    Edit listing
                  </Link>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="category">{business.mainCategory.name}</Badge>
                {business.subCategories.map(({ subCategory }) => (
                  <Badge key={subCategory.id} variant="category">
                    {subCategory.name}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {business.entity.name} &middot; {business.type.name}
                </span>
                {business.establishedYear && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    Est. {business.establishedYear}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Details ---------- */}
      <section className="bg-sand/20 py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-sm border border-sand bg-paper px-5 sm:px-8">
            <BusinessDetailTabs
              businessSlug={business.slug}
              about={business.about}
              productsServices={business.productsServices}
              experience={business.experience}
              socialLinks={socialLinks}
              contact={{
                businessPhone: business.businessPhone,
                personalPhone: business.personalPhone,
                email: business.email,
                website: business.website,
                brochureUrl: business.brochureUrl,
              }}
              isLoggedIn={Boolean(session?.user)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
