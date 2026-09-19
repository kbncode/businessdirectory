"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatMonthDay } from "@/lib/format";
import type { DailyPromotionEventPoint } from "@/lib/queries/owner-dashboard";

export function PromotionEventsChart({ points }: { points: DailyPromotionEventPoint[] }) {
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
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="impressions" name="Impressions" stroke="#F06826" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#000000" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
