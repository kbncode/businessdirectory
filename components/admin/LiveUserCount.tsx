"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

const POLL_MS = 30 * 1000;

// Polled rather than pushed (no websocket infra here) — 30s is frequent
// enough to feel "live" for an admin glancing at the dashboard without
// hammering the DB. Server-rendered initialCount avoids a loading flash on
// first paint; polling only starts after that.
export function LiveUserCount({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/live-users");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.count === "number") setCount(data.count);
      } catch {
        // A missed poll just means the number goes stale for one cycle —
        // never worth surfacing as an error on the dashboard.
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-sm border border-sand bg-paper p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-sand">
        <Radio className="h-5 w-5 text-ink" strokeWidth={1.75} />
      </span>
      <p className="mt-4 flex items-center gap-2 font-display text-3xl font-bold text-ink">
        {count}
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
      </p>
      <p className="mt-1 text-sm text-stone">Live users now</p>
    </div>
  );
}
