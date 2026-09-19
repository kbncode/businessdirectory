"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DateRangePreset } from "@/lib/queries/owner-dashboard";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

interface DateRangeTabsProps {
  activeRange: DateRangePreset;
  customStart: string;
  customEnd: string;
}

export function DateRangeTabs({ activeRange, customStart, customEnd }: DateRangeTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Local so the date inputs feel responsive while typing — the URL (and
  // therefore the server refetch) only updates on preset select or "Apply".
  const [start, setStart] = useState(customStart);
  const [end, setEnd] = useState(customEnd);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function selectPreset(preset: DateRangePreset) {
    if (preset === "custom") {
      updateParams({ range: "custom", start, end });
    } else {
      updateParams({ range: preset, start: "", end: "" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex w-fit flex-wrap gap-1 rounded-sm border border-sand bg-paper p-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => selectPreset(preset.value)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              activeRange === preset.value ? "bg-signalOrange text-ink" : "text-stone hover:bg-sand"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {activeRange === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-stone">
            Start date
            <input
              type="date"
              value={start}
              max={end || undefined}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-sm border border-sand px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-stone">
            End date
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-sm border border-sand px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <button
            type="button"
            onClick={() => updateParams({ range: "custom", start, end })}
            className="rounded-sm border border-ink px-3 py-1.5 text-sm text-ink transition-colors hover:bg-sand"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
