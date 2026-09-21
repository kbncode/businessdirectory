"use client";

import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { CityIconControl } from "@/components/admin/CityIconControl";
import type { listCitiesWithHomeFeature } from "@/lib/queries/admin-home-cities";

type CityWithFeature = Awaited<ReturnType<typeof listCitiesWithHomeFeature>>[number];

interface CityRow {
  id: string;
  name: string;
  stateName: string;
  featureId: string | null;
  featured: boolean;
  iconUrl: string | null;
  sortOrder: number;
}

function toRow(city: CityWithFeature): CityRow {
  return {
    id: city.id,
    name: city.name,
    stateName: city.state.name,
    featureId: city.homeFeature?.id ?? null,
    featured: city.homeFeature?.isActive ?? false,
    iconUrl: city.homeFeature?.iconUrl ?? null,
    sortOrder: city.homeFeature?.sortOrder ?? 0,
  };
}

const PAGE_SIZE = 20;

const inputClass =
  "rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange";

export function HomeCitiesManager({ initialCities }: { initialCities: CityWithFeature[] }) {
  const [cities, setCities] = useState<CityRow[]>(() => initialCities.map(toRow));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [draggedCityId, setDraggedCityId] = useState<string | null>(null);
  const [busyCityId, setBusyCityId] = useState<string | null>(null);

  const featuredCities = useMemo(
    () => cities.filter((c) => c.featured).sort((a, b) => a.sortOrder - b.sortOrder),
    [cities]
  );

  const filtered = useMemo(() => {
    if (!search) return cities;
    const q = search.toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(q) || c.stateName.toLowerCase().includes(q));
  }, [cities, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateCity(cityId: string, patch: Partial<CityRow>) {
    setCities((prev) => prev.map((c) => (c.id === cityId ? { ...c, ...patch } : c)));
  }

  async function toggleFeatured(city: CityRow) {
    const nextFeatured = !city.featured;
    setBusyCityId(city.id);
    updateCity(city.id, { featured: nextFeatured });

    try {
      const res = await fetch(`/api/admin/home-cities/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });
      const data = await res.json();
      if (!res.ok) {
        updateCity(city.id, { featured: city.featured });
        setToast({ message: data.error ?? "Failed to update city.", tone: "error" });
        return;
      }

      if (data.feature) {
        updateCity(city.id, {
          featureId: data.feature.id,
          featured: data.feature.isActive,
          sortOrder: data.feature.sortOrder,
          iconUrl: data.feature.iconUrl,
        });
      }
      setToast({
        message: nextFeatured ? `"${city.name}" is now featured.` : `"${city.name}" removed from featured.`,
        tone: "success",
      });
    } catch {
      updateCity(city.id, { featured: city.featured });
      setToast({ message: "Failed to update city.", tone: "error" });
    } finally {
      setBusyCityId(null);
    }
  }

  function handleIconUploaded(cityId: string, iconUrl: string) {
    updateCity(cityId, { iconUrl });
  }

  function handleIconRemoved(cityId: string) {
    updateCity(cityId, { iconUrl: null });
  }

  function handleDrop(targetCityId: string) {
    if (!draggedCityId || draggedCityId === targetCityId) {
      setDraggedCityId(null);
      return;
    }

    const ordered = [...featuredCities];
    const fromIndex = ordered.findIndex((c) => c.id === draggedCityId);
    const toIndex = ordered.findIndex((c) => c.id === targetCityId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedCityId(null);
      return;
    }

    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);

    const sortOrderByCityId = new Map(ordered.map((c, index) => [c.id, index]));
    setCities((prev) =>
      prev.map((c) => (sortOrderByCityId.has(c.id) ? { ...c, sortOrder: sortOrderByCityId.get(c.id)! } : c))
    );

    const orderedFeatureIds = ordered.map((c) => c.featureId).filter((id): id is string => Boolean(id));
    fetch("/api/admin/home-cities/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: orderedFeatureIds }),
    }).catch(() => {
      setToast({ message: "Failed to save new order.", tone: "error" });
    });

    setDraggedCityId(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {/* ---------- Currently featured (reorderable) ---------- */}
      <div>
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">
          Currently featured ({featuredCities.length})
        </h2>

        {featuredCities.length === 0 ? (
          <p className="mt-3 text-sm text-stone">No cities are featured on the home page yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {featuredCities.map((city) => (
              <li
                key={city.id}
                draggable
                onDragStart={() => setDraggedCityId(city.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(city.id)}
                className="flex flex-wrap items-center gap-4 rounded-sm border border-sand bg-paper p-3 transition-colors hover:bg-sand/20"
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-move text-stone" strokeWidth={1.75} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{city.name}</p>
                  <p className="text-xs text-stone">{city.stateName}</p>
                </div>
                <CityIconControl
                  cityId={city.id}
                  iconUrl={city.iconUrl}
                  onUploaded={(url) => handleIconUploaded(city.id, url)}
                  onRemoved={() => handleIconRemoved(city.id)}
                />
                <button
                  type="button"
                  disabled={busyCityId === city.id}
                  onClick={() => toggleFeatured(city)}
                  className="shrink-0 rounded-sm border border-ink px-2 py-1 text-xs text-ink transition-colors hover:bg-sand disabled:opacity-40"
                >
                  Unfeature
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SectionDivider />

      {/* ---------- All cities (searchable + paginated) ---------- */}
      <div>
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">All cities</h2>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search cities"
            className={cn(inputClass, "w-64")}
          />
          <span className="text-xs text-stone">{filtered.length} total</span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-sm border border-sand">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-stone">
                <th className="py-2 pl-4 pr-3">City</th>
                <th className="py-2 pr-3">State</th>
                <th className="py-2 pr-3">Feature on home page</th>
                <th className="py-2 pr-4">Icon</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 pl-4 text-sm text-stone">
                    No cities found.
                  </td>
                </tr>
              ) : (
                visible.map((city) => (
                  <tr key={city.id} className="border-t border-sand bg-paper transition-colors hover:bg-sand/40">
                    <td className="py-2 pl-4 pr-3 text-ink">{city.name}</td>
                    <td className="py-2 pr-3 text-stone">{city.stateName}</td>
                    <td className="py-2 pr-3">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={city.featured}
                          disabled={busyCityId === city.id}
                          onChange={() => toggleFeatured(city)}
                          className="h-4 w-4 border-ink text-signalOrange focus:ring-signalOrange"
                        />
                        <span className="text-xs text-stone">Featured</span>
                      </label>
                    </td>
                    <td className="py-2 pr-4">
                      {city.featured && (
                        <CityIconControl
                          cityId={city.id}
                          iconUrl={city.iconUrl}
                          onUploaded={(url) => handleIconUploaded(city.id, url)}
                          onRemoved={() => handleIconRemoved(city.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-sm border border-ink px-3 py-1.5 text-ink disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-stone">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded-sm border border-ink px-3 py-1.5 text-ink disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
