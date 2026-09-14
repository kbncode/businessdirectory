"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { BrowseListItem } from "@/lib/queries/business";

interface BrowseResultsProps {
  initialItems: BrowseListItem[];
  initialCursor: string | null;
  // The filter portion of the query string (no `cursor`/`page`), reused to
  // fetch subsequent pages from /api/businesses/search.
  filterQuery: string;
}

function locationFor(item: BrowseListItem) {
  return [item.city, item.stateName ?? item.countryName].filter(Boolean).join(", ");
}

export function BrowseResults({ initialItems, initialCursor, filterQuery }: BrowseResultsProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(filterQuery);
      params.set("cursor", cursor);
      const res = await fetch(`/api/businesses/search?${params.toString()}`);
      const data: { items: BrowseListItem[]; nextCursor: string | null } = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <BusinessCard
            key={item.id}
            href={`/business/${item.slug}`}
            name={item.businessName}
            location={locationFor(item)}
            category={item.mainCategoryName}
            about={item.about ?? item.productsServices ?? ""}
            photoUrl={item.photoUrl}
          />
        ))}
      </div>

      {cursor && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className={cn(buttonClasses("secondary"), "gap-2 disabled:opacity-60")}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />}
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
