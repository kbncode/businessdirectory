import { getViewerSession } from "@/lib/auth";
import { getMyApprovedBusinesses, getActivePromotionForBusiness } from "@/lib/queries/promotions";
import { PromotionForm } from "./PromotionForm";

export default async function NewPromotionPage() {
  const session = await getViewerSession();
  // Middleware already redirects an unauthenticated visit to /login, but
  // session.user.id is needed below regardless.
  if (!session?.user?.id) return null;

  const businesses = await getMyApprovedBusinesses(session.user.id);

  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-ink">Make an offer</h1>
        <p className="mt-6 rounded-sm border border-sand bg-sand/30 px-4 py-3 text-sm text-stone">
          You need an approved business listing before you can create a promotion.
        </p>
      </div>
    );
  }

  // Resolved up front (rather than a live check on selection) so the form
  // can block an already-active business immediately, with no extra
  // round-trip — the owner's approved-business count is always small.
  const activeBusinessIds = new Set(
    (
      await Promise.all(
        businesses.map(async (b) => ((await getActivePromotionForBusiness(b.id)) ? b.id : null))
      )
    ).filter((id): id is string => id !== null)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Make an offer</h1>
      <p className="mt-1 text-sm text-stone">
        Create an offer, advertisement, or campaign for one of your approved businesses.
      </p>

      <div className="mt-8">
        <PromotionForm businesses={businesses} activeBusinessIds={Array.from(activeBusinessIds)} />
      </div>
    </div>
  );
}
