"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";

function toDateInputValue(value: Date | string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export interface FeaturedToggleValue {
  isFeatured: boolean;
  featuredStartDate: string | null;
  featuredEndDate: string | null;
}

interface FeaturedToggleProps {
  businessId: string;
  businessName: string;
  status: string;
  initial: FeaturedToggleValue;
  onSaved: (business: FeaturedToggleValue) => void;
}

export function FeaturedToggle({ businessId, businessName, status, initial, onSaved }: FeaturedToggleProps) {
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [startDate, setStartDate] = useState(toDateInputValue(initial.featuredStartDate));
  const [endDate, setEndDate] = useState(toDateInputValue(initial.featuredEndDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/feature`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFeatured,
          featuredStartDate: isFeatured && startDate ? startDate : null,
          featuredEndDate: isFeatured && endDate ? endDate : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      onSaved({
        isFeatured: data.business.isFeatured,
        featuredStartDate: data.business.featuredStartDate,
        featuredEndDate: data.business.featuredEndDate,
      });
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 text-ink">
      <p className="text-sm text-stone">{businessName}</p>

      {status !== "APPROVED" && (
        <p className="rounded-sm border border-signalOrange/40 bg-signalOrange/10 p-3 text-sm text-ink">
          Only approved listings can be featured. Approve this listing first.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={isFeatured}
          disabled={status !== "APPROVED"}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded-sm border-ink text-signalOrange focus:ring-signalOrange"
        />
        Make featured
      </label>

      {isFeatured && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-stone" htmlFor="featured-start">
              Start date (optional)
            </label>
            <input
              id="featured-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={cn(inputClass, "mt-1 w-full")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-stone" htmlFor="featured-end">
              End date (optional)
            </label>
            <input
              id="featured-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn(inputClass, "mt-1 w-full")}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-sm border border-rejectedRed/30 bg-rejectedRed/10 p-3 text-sm text-rejectedRed">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className={cn(buttonClasses("primary"), "self-start disabled:opacity-60")}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
