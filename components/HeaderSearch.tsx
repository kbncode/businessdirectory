"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

// The hero search on "/" is the single primary search entry point — the
// header shows nothing there. Everywhere else (e.g. /browse) it collapses
// to an icon that expands into a small search field on click, instead of
// an always-visible input competing with the hero search.
export function HeaderSearch() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/") return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search businesses"
        className="rounded-sm p-2 text-ink transition-colors hover:bg-sand"
      >
        <Search className="h-4 w-4" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <form action="/browse" method="GET" className="flex w-full items-center gap-1 sm:w-auto">
      <label htmlFor="header-search" className="sr-only">
        Search businesses
      </label>
      <input
        id="header-search"
        type="search"
        name="q"
        autoFocus
        placeholder="Search businesses"
        className="w-full rounded-sm border border-ink bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange sm:w-56"
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close search"
        className="shrink-0 rounded-sm p-1.5 text-stone hover:text-ink"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </form>
  );
}
