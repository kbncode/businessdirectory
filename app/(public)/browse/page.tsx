import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";
import {
  searchApprovedBusinessesCursor,
  countApprovedBusinesses,
  getFilterMasterData,
  getAreaSuggestions,
  type BusinessFilters,
} from "@/lib/queries/business";
import { BrowseFilterPanel } from "./BrowseFilterPanel";
import { BrowseResults } from "./BrowseResults";

type SearchParams = Record<string, string | string[] | undefined>;
type MasterData = Awaited<ReturnType<typeof getFilterMasterData>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseFilters(searchParams: SearchParams): BusinessFilters {
  return {
    country: first(searchParams.country) || undefined,
    state: first(searchParams.state) || undefined,
    city: first(searchParams.city) || undefined,
    area: first(searchParams.area) || undefined,
    mainCategory: first(searchParams.mainCategory) || undefined,
    subCategories: toArray(searchParams.subCategory),
    q: first(searchParams.q) || undefined,
  };
}

// Query string for the filters only (no cursor) — reused both to build the
// "clear this filter" chip links and as the base for client-side
// "Load more" fetches against /api/businesses/search.
function filterQueryString(filters: BusinessFilters) {
  const params = new URLSearchParams();
  if (filters.country) params.set("country", filters.country);
  if (filters.state) params.set("state", filters.state);
  if (filters.city) params.set("city", filters.city);
  if (filters.area) params.set("area", filters.area);
  if (filters.mainCategory) params.set("mainCategory", filters.mainCategory);
  for (const id of filters.subCategories ?? []) params.append("subCategory", id);
  if (filters.q) params.set("q", filters.q);
  return params;
}

function buildHref(filters: BusinessFilters, drop?: { key: keyof BusinessFilters; value?: string }) {
  const next: BusinessFilters = { ...filters };
  if (drop) {
    if (drop.key === "subCategories" && drop.value) {
      next.subCategories = (next.subCategories ?? []).filter((id) => id !== drop.value);
    } else {
      delete next[drop.key];
    }
  }
  const qs = filterQueryString(next).toString();
  return qs ? `/browse?${qs}` : "/browse";
}

function buildActiveChips(filters: BusinessFilters, masterData: MasterData) {
  const chips: { key: string; label: string; href: string }[] = [];

  if (filters.country) {
    const name = masterData.countries.find((c) => c.id === filters.country)?.name ?? filters.country;
    chips.push({ key: "country", label: `Country: ${name}`, href: buildHref(filters, { key: "country" }) });
  }
  if (filters.state) {
    const name = masterData.states.find((s) => s.id === filters.state)?.name ?? filters.state;
    chips.push({ key: "state", label: `State: ${name}`, href: buildHref(filters, { key: "state" }) });
  }
  if (filters.city) {
    chips.push({ key: "city", label: `City: ${filters.city}`, href: buildHref(filters, { key: "city" }) });
  }
  if (filters.area) {
    chips.push({ key: "area", label: `Area: ${filters.area}`, href: buildHref(filters, { key: "area" }) });
  }
  if (filters.mainCategory) {
    const name = masterData.mainCategories.find((m) => m.id === filters.mainCategory)?.name ?? filters.mainCategory;
    chips.push({
      key: "mainCategory",
      label: `Category: ${name}`,
      href: buildHref(filters, { key: "mainCategory" }),
    });
  }
  for (const subId of filters.subCategories ?? []) {
    const name = masterData.subCategories.find((s) => s.id === subId)?.name ?? subId;
    chips.push({
      key: `subCategory:${subId}`,
      label: name,
      href: buildHref(filters, { key: "subCategories", value: subId }),
    });
  }
  if (filters.q) {
    chips.push({ key: "q", label: `"${filters.q}"`, href: buildHref(filters, { key: "q" }) });
  }

  return chips;
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(searchParams);

  const [masterData, firstPage, total, areaSuggestions] = await Promise.all([
    getFilterMasterData(),
    searchApprovedBusinessesCursor(filters),
    countApprovedBusinesses(filters),
    getAreaSuggestions(filters.city),
  ]);

  const activeChips = buildActiveChips(filters, masterData);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Browse businesses</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <BrowseFilterPanel masterData={masterData} filters={filters} areaSuggestions={areaSuggestions} />
        </aside>

        <div>
          {activeChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <Link
                  key={chip.key}
                  href={chip.href}
                  className="group inline-flex items-center gap-1.5 rounded-sm bg-sand px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-sand/70"
                >
                  {chip.label}
                  <X className="h-3 w-3 text-stone transition-colors group-hover:text-ink" strokeWidth={2} />
                </Link>
              ))}
              {activeChips.length >= 2 && (
                <Link
                  href="/browse"
                  className="text-xs font-medium text-signalOrange hover:underline"
                >
                  Clear all
                </Link>
              )}
            </div>
          )}

          <p className="text-sm text-stone">
            <span className="font-display text-base font-bold text-ink">{total}</span>{" "}
            {total === 1 ? "business" : "businesses"} found
          </p>

          {firstPage.items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-stone">No businesses match these filters yet</p>
              <Link href="/browse" className={cn(buttonClasses("primary"), "mt-4 inline-flex")}>
                Clear filters
              </Link>
            </div>
          ) : (
            <BrowseResults
              // Remounts the results list whenever the filters change —
              // without this, Next.js reuses the same client component
              // instance across a filter-driven router.push (same /browse
              // route, new search params), and useState(initialItems) only
              // ever reads its initial prop once, so the row list kept
              // showing the previous filter's results even though the
              // count above it (computed server-side on every request) was
              // already correct.
              key={filterQueryString(filters).toString()}
              initialItems={firstPage.items}
              initialCursor={firstPage.nextCursor}
              filterQuery={filterQueryString(filters).toString()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
