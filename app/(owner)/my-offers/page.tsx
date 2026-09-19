import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { getViewerSession } from "@/lib/auth";
import { getMyPromotions } from "@/lib/queries/promotions";
import { OffersTable } from "./OffersTable";

export default async function MyOffersPage() {
  const session = await getViewerSession();
  // Middleware already redirects an unauthenticated visit to /login, but
  // session.user.id is needed below regardless.
  if (!session?.user?.id) return null;

  const promotions = await getMyPromotions(session.user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">My offers</h1>
        <Link href="/my-offers/new" className={buttonClasses("primary")}>
          Make an Offer
        </Link>
      </div>

      {promotions.length === 0 ? (
        <p className="mt-8 text-sm text-stone">
          You haven&apos;t submitted a promotion yet.{" "}
          <Link href="/my-offers/new" className="underline">
            Make your first offer
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6">
          <OffersTable initialPromotions={promotions} />
        </div>
      )}
    </div>
  );
}
