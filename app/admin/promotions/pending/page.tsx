import { getPendingPromotions } from "@/lib/queries/admin-promotions";
import { PendingPromotionsQueue } from "./PendingPromotionsQueue";

export default async function AdminPendingPromotionsPage() {
  const promotions = await getPendingPromotions();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Pending Promotions</h1>
      <p className="mt-1 text-sm text-stone">Offers, advertisements, and campaigns awaiting approval.</p>

      <div className="mt-6">
        <PendingPromotionsQueue initialPromotions={promotions} />
      </div>
    </div>
  );
}
