import Link from "next/link";
import { Store } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buttonClasses } from "@/components/ui/Button";
import { MakeOfferAction } from "@/components/promotions/MakeOfferAction";
import { getViewerSession } from "@/lib/auth";
import { getMyListings } from "@/lib/queries/my-listings";
import { formatDate } from "@/lib/format";

export default async function MyListingsPage() {
  const session = await getViewerSession();
  // Middleware already redirects an unauthenticated visit to /login, but
  // session.user.id is needed below regardless.
  if (!session?.user?.id) return null;

  const listings = await getMyListings(session.user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">My listings</h1>
        <div className="flex flex-wrap items-center gap-2">
          <MakeOfferAction ownerId={session.user.id} className="text-sm" />
          <Link href="/register" className={buttonClasses("primary")}>
            List a new business
          </Link>
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="mt-8 text-sm text-stone">
          You haven&apos;t listed a business yet.{" "}
          <Link href="/register" className="underline">
            List your business
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {listings.map((listing) => (
            <li key={listing.id} className="rounded-sm border border-sand bg-paper p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-sand bg-sand">
                  {listing.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Blob/local-hosted thumbnail
                    <img src={listing.photoUrl} alt={listing.businessName} className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-5 w-5 text-stone" strokeWidth={1.75} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-ink">{listing.businessName}</p>
                  <p className="truncate text-sm text-stone">
                    {listing.mainCategory.name} &middot; {listing.city}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={listing.status} />
                    <span className="text-xs text-stone">Submitted {formatDate(listing.createdAt)}</span>
                  </div>
                  {listing.status === "REJECTED" && listing.rejectionReason && (
                    <p className="mt-2 text-xs text-rejectedRed">Reason: {listing.rejectionReason}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {listing.status === "APPROVED" && (
                    <Link
                      href={`/business/${listing.slug}`}
                      className="rounded-sm border border-ink px-3 py-1.5 text-xs text-ink hover:bg-sand"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/my-listings/${listing.id}/edit`}
                    className="rounded-sm bg-signalOrange px-3 py-1.5 text-xs font-medium text-ink hover:bg-signalOrange/90"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
