"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMonthDay } from "@/lib/format";
import type { DailySiteVisitPoint } from "@/lib/queries/admin-dashboard";

// Same visual treatment as components/owner/ProfileViewsChart.tsx (hex
// values match tailwind.config's ink/paper/stone/sand/signalOrange) — kept
// as its own file since the data shape (visits vs. views) differs slightly
// and this one has no per-business scoping.
export function SiteVisitsChart({ points }: { points: DailySiteVisitPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EFE7DC" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => formatMonthDay(d)}
            tick={{ fontSize: 11, fill: "#6B6560" }}
            axisLine={{ stroke: "#EFE7DC" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B6560" }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            labelFormatter={(d) => formatMonthDay(d as string)}
            contentStyle={{ borderRadius: 2, borderColor: "#EFE7DC", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="visits" name="Visitors" stroke="#F06826" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
