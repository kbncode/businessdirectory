"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { BrowseFilters, type BrowseFiltersProps } from "./BrowseFilters";

// Desktop: the plain static sidebar. Mobile: collapses to a "Filters"
// button that opens a slide-over drawer instead of pushing the results
// down the page. Both render the same <BrowseFilters> — only one is ever
// visible at a time (Tailwind's `hidden`/breakpoint classes), so there's no
// duplicate submission: whichever instance the user actually touches is the
// one that debounces/submits.
export function BrowseFilterPanel(props: BrowseFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
          Filters
        </button>
      </div>

      <div className="hidden lg:block">
        <BrowseFilters {...props} />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-paper shadow-lg">
            <div className="flex items-center justify-between border-b border-sand px-5 py-4">
              <span className="font-display text-base font-bold text-ink">Filters</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="rounded-sm p-1.5 text-stone transition-colors hover:text-ink"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <BrowseFilters {...props} onApplied={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
