import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAllPromotionsForAdmin } from "@/lib/queries/admin-promotions";
import { PromotionsTable } from "./PromotionsTable";

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Removed", value: "REMOVED" },
];

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status = searchParams.status || undefined;
  const q = searchParams.q || undefined;

  const firstPage = await getAllPromotionsForAdmin({ status: status as never, q });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Promotions</h1>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const params = new URLSearchParams();
            if (tab.value) params.set("status", tab.value);
            if (q) params.set("q", q);
            const href = params.toString() ? `/admin/promotions?${params.toString()}` : "/admin/promotions";
            const isActive = (status || "") === tab.value;
            return (
              <Link
                key={tab.label}
                href={href}
                className={cn(
                  "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-signalOrange text-ink" : "bg-sand text-stone hover:text-ink"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <form action="/admin/promotions" method="GET" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by title or business name"
            className="w-64 rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange"
          />
          <button type="submit" className="rounded-sm border border-ink px-3 py-2 text-sm text-ink hover:bg-sand">
            Search
          </button>
        </form>
      </div>

      <div className="mt-6">
        <PromotionsTable initialPromotions={firstPage.items} initialCursor={firstPage.nextCursor} status={status} q={q} />
      </div>
    </div>
  );
}
