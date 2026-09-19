"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { OwnerBusinessOption } from "@/lib/queries/owner-dashboard";

interface BusinessFilterSelectProps {
  businesses: OwnerBusinessOption[];
  selected: string; // a business id, or "all"
}

// Only rendered by the page when the owner has more than one business —
// changing it updates the ?business= URL param, which re-runs the server
// component's data fetch scoped to that one business (or clears it back to
// "all my businesses").
export function BusinessFilterSelect({ businesses, selected }: BusinessFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("business");
    else params.set("business", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={selected}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-sm border border-sand bg-paper px-3 py-2 text-sm text-ink"
    >
      <option value="all">All my businesses</option>
      {businesses.map((b) => (
        <option key={b.id} value={b.id}>
          {b.businessName}
        </option>
      ))}
    </select>
  );
}
