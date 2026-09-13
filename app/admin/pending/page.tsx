import { getPendingBusinesses } from "@/lib/queries/admin-business";
import { PendingQueue } from "./PendingQueue";

export default async function AdminPendingPage() {
  const businesses = await getPendingBusinesses();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Pending Review</h1>
      <p className="mt-1 text-sm text-stone">New business listings awaiting approval.</p>

      <div className="mt-6">
        <PendingQueue initialBusinesses={businesses} />
      </div>
    </div>
  );
}
