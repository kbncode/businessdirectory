import { startOfUtcDay } from "@/lib/visitor";

// Shared by lib/queries/owner-dashboard.ts and lib/queries/admin-dashboard.ts
// — both dashboards use the same today/week/month/year/custom preset and
// the same daily-bucket trend shape, so this logic lives in exactly one
// place rather than being copy-pasted per dashboard.

export type DateRangePreset = "today" | "week" | "month" | "year" | "custom";

export interface ResolvedDateRange {
  start: Date;
  end: Date;
}

// Every stored *Date column is already truncated to midnight UTC (see
// lib/visitor.ts's startOfUtcDay, used by every tracking route) — ranges
// here are resolved the same way so a plain [gte start, lte end] comparison
// lines up exactly, with no off-by-one from timezone drift.
export function resolveDateRange(
  preset: DateRangePreset,
  custom?: { start?: string | null; end?: string | null }
): ResolvedDateRange {
  const todayStart = startOfUtcDay();

  switch (preset) {
    case "today":
      return { start: todayStart, end: todayStart };
    case "week": {
      const start = new Date(todayStart);
      start.setUTCDate(start.getUTCDate() - 6);
      return { start, end: todayStart };
    }
    case "month": {
      const start = new Date(todayStart);
      start.setUTCDate(start.getUTCDate() - 29);
      return { start, end: todayStart };
    }
    case "year": {
      const start = new Date(todayStart);
      start.setUTCFullYear(start.getUTCFullYear() - 1);
      start.setUTCDate(start.getUTCDate() + 1);
      return { start, end: todayStart };
    }
    case "custom": {
      const parsedStart = custom?.start ? startOfUtcDay(new Date(custom.start)) : todayStart;
      const parsedEnd = custom?.end ? startOfUtcDay(new Date(custom.end)) : todayStart;
      // A reversed range (end before start) would otherwise silently
      // produce an empty query result with no indication why — swap
      // instead, so "Custom" always shows something sensible.
      return parsedStart <= parsedEnd ? { start: parsedStart, end: parsedEnd } : { start: parsedEnd, end: parsedStart };
    }
  }
}

export function eachDayIso(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
