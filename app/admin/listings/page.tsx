import Link from "next/link";
import type { BusinessStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getAllBusinessesForAdmin } from "@/lib/queries/admin-business";
import { ListingsTable } from "./ListingsTable";

const TABS: { label: string; value: BusinessStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status = (searchParams.status as BusinessStatus | undefined) || undefined;
  const q = searchParams.q || undefined;

  const firstPage = await getAllBusinessesForAdmin({ status, q });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">All Listings</h1>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {TABS.map((tab) => {
            const params = new URLSearchParams();
            if (tab.value) params.set("status", tab.value);
            if (q) params.set("q", q);
            const href = params.toString() ? `/admin/listings?${params.toString()}` : "/admin/listings";
            const isActive = (searchParams.status || "") === tab.value;
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

        <form action="/admin/listings" method="GET" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by business or owner name"
            className="w-64 rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange"
          />
          <button
            type="submit"
            className="rounded-sm border border-ink px-3 py-2 text-sm text-ink hover:bg-sand"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-6">
        <ListingsTable
          initialBusinesses={firstPage.items}
          initialCursor={firstPage.nextCursor}
          status={status}
          q={q}
        />
      </div>
    </div>
  );
}
