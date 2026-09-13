"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";
import type { BusinessFilters, getFilterMasterData } from "@/lib/queries/business";

export interface BrowseFiltersProps {
  masterData: Awaited<ReturnType<typeof getFilterMasterData>>;
  filters: BusinessFilters;
  areaSuggestions: string[];
  // Called after a filter change is submitted (Apply, Reset, or the
  // keyword debounce) — the mobile drawer uses this to close itself.
  onApplied?: () => void;
}

const inputClass =
  "mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange";
const selectClass = cn(inputClass, "appearance-none pr-9");
const labelClass = "block text-xs font-medium uppercase tracking-wide text-stone";
const groupHeadingClass = "font-display text-sm font-bold text-ink";

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
          strokeWidth={1.75}
        />
      </div>
    </div>
  );
}

export function BrowseFilters({ masterData, filters, areaSuggestions, onApplied }: BrowseFiltersProps) {
  const router = useRouter();

  const [country, setCountry] = useState(filters.country ?? "");
  const [state, setState] = useState(filters.state ?? "");
  const [city, setCity] = useState(filters.city ?? "");
  const [area, setArea] = useState(filters.area ?? "");
  const [mainCategory, setMainCategory] = useState(filters.mainCategory ?? "");
  const [subCategories, setSubCategories] = useState<string[]>(filters.subCategories ?? []);
  const [q, setQ] = useState(filters.q ?? "");

  const statesForCountry = useMemo(
    () => masterData.states.filter((s) => s.countryId === country),
    [masterData.states, country]
  );
  const citiesForState = useMemo(
    () => masterData.cities.filter((c) => c.stateId === state),
    [masterData.cities, state]
  );
  const subCategoriesForMain = useMemo(
    () => masterData.subCategories.filter((s) => s.mainCategoryId === mainCategory),
    [masterData.subCategories, mainCategory]
  );

  function toggleSubCategory(id: string) {
    setSubCategories((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function submitFilters() {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (area) params.set("area", area);
    if (mainCategory) params.set("mainCategory", mainCategory);
    for (const id of subCategories) params.append("subCategory", id);
    if (q) params.set("q", q);
    router.push(`/browse?${params.toString()}`);
    onApplied?.();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitFilters();
  }

  // Keyword search debounces on its own (~350ms after the user stops
  // typing) instead of waiting for the "Apply filters" click — country/
  // state/city/category stay batched behind the explicit Apply action so
  // picking several filters in a row still fires one combined request, not
  // one per change.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(submitFilters, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the keyword should debounce-trigger a submit
  }, [q]);

  function handleReset() {
    setCountry("");
    setState("");
    setCity("");
    setArea("");
    setMainCategory("");
    setSubCategories([]);
    setQ("");
    router.push("/browse");
    onApplied?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className={labelClass} htmlFor="filter-q">
          Keyword
        </label>
        <input
          id="filter-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Business name, product or service"
          className={inputClass}
        />
      </div>

      <SectionDivider />

      <div className="flex flex-col gap-4">
        <p className={groupHeadingClass}>Location</p>

        <SelectField id="filter-country" label="Country" value={country} onChange={(v) => {
          setCountry(v);
          setState("");
          setCity("");
          setArea("");
        }}>
          <option value="">All countries</option>
          {masterData.countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>

        {statesForCountry.length > 0 && (
          <SelectField
            id="filter-state"
            label="State"
            value={state}
            onChange={(v) => {
              setState(v);
              setCity("");
              setArea("");
            }}
          >
            <option value="">All states</option>
            {statesForCountry.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        )}

        <div>
          <label className={labelClass} htmlFor="filter-city">
            City
          </label>
          {state && citiesForState.length > 0 ? (
            <div className="relative">
              <select
                id="filter-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={selectClass}
              >
                <option value="">All cities</option>
                {citiesForState.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
                strokeWidth={1.75}
              />
            </div>
          ) : (
            <input
              id="filter-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className={inputClass}
            />
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="filter-area">
            Area
          </label>
          <input
            id="filter-area"
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            list="area-suggestions"
            placeholder="Area"
            className={inputClass}
          />
          <datalist id="area-suggestions">
            {areaSuggestions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
      </div>

      <SectionDivider />

      <div className="flex flex-col gap-4">
        <p className={groupHeadingClass}>Category</p>

        <SelectField
          id="filter-main-category"
          label="Main category"
          value={mainCategory}
          onChange={(v) => {
            setMainCategory(v);
            setSubCategories([]);
          }}
        >
          <option value="">All categories</option>
          {masterData.mainCategories.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </SelectField>

        {subCategoriesForMain.length > 0 && (
          <div>
            <span className={labelClass}>Sub-category</span>
            <div className="mt-2 flex max-h-48 flex-col gap-0.5 overflow-y-auto">
              {subCategoriesForMain.map((sub) => (
                <label
                  key={sub.id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink transition-colors hover:bg-sand"
                >
                  <input
                    type="checkbox"
                    checked={subCategories.includes(sub.id)}
                    onChange={() => toggleSubCategory(sub.id)}
                    className="h-4 w-4 rounded-sm border-ink text-signalOrange focus:ring-signalOrange"
                  />
                  {sub.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <SectionDivider />

      <div className="flex gap-2">
        <button type="submit" className={cn(buttonClasses("primary"), "flex-1")}>
          Apply filters
        </button>
        <button type="button" onClick={handleReset} className={buttonClasses("ghost")}>
          Reset
        </button>
      </div>
    </form>
  );
}
