import { CheckCircle2, Clock, XCircle, Users, UserCheck } from "lucide-react";
import { DateRangeTabs } from "@/components/ui/DateRangeTabs";
import { SiteVisitsChart } from "@/components/admin/SiteVisitsChart";
import { LiveUserCount } from "@/components/admin/LiveUserCount";
import {
  getDashboardStats,
  getTopMainCategories,
  getTopCities,
  getActiveViewerCounts,
  getLiveViewerCount,
  getSiteVisitorTrend,
  resolveDateRange,
  type DateRangePreset,
  type BreakdownItem,
} from "@/lib/queries/admin-dashboard";

const STAT_ICONS = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
  viewers: Users,
  active: UserCheck,
} as const;

const RANGE_LABEL: Record<DateRangePreset, string> = {
  today: "today",
  week: "this week",
  month: "this month",
  year: "this year",
  custom: "in this range",
};

const VALID_PRESETS = new Set<DateRangePreset>(["today", "week", "month", "year", "custom"]);

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: keyof typeof STAT_ICONS }) {
  const Icon = STAT_ICONS[icon];
  return (
    <div className="rounded-sm border border-sand bg-paper p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-sand">
        <Icon className="h-5 w-5 text-ink" strokeWidth={1.75} />
      </span>
      <p className="mt-4 font-display text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-sm text-stone">{label}</p>
    </div>
  );
}

function BreakdownTable({ title, items }: { title: string; items: BreakdownItem[] }) {
  return (
    <div className="rounded-sm border border-sand bg-paper">
      <h2 className="border-b border-sand px-5 py-4 font-display text-base font-bold text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-stone">No data yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <tbody>
            {items.map((item) => (
              <tr key={item.label} className="border-b border-sand last:border-b-0">
                <td className="truncate px-5 py-3 text-ink">{item.label}</td>
                <td className="px-5 py-3 text-right font-display font-bold text-ink">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface Props {
  searchParams: SearchParams;
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const rawRange = first(searchParams.range);
  const range: DateRangePreset = rawRange && VALID_PRESETS.has(rawRange as DateRangePreset) ? (rawRange as DateRangePreset) : "week";
  const customStart = first(searchParams.start) ?? "";
  const customEnd = first(searchParams.end) ?? "";
  const dateRange = resolveDateRange(range, { start: customStart, end: customEnd });

  const [stats, topCategories, topCities, activeCounts, liveCount, visitTrend] = await Promise.all([
    getDashboardStats(),
    getTopMainCategories(10),
    getTopCities(10),
    getActiveViewerCounts(),
    getLiveViewerCount(),
    getSiteVisitorTrend(dateRange),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Approved listings" value={stats.approvedCount} icon="approved" />
        <StatCard label="Pending review" value={stats.pendingCount} icon="pending" />
        <StatCard label="Rejected" value={stats.rejectedCount} icon="rejected" />
        <StatCard label="Registered viewers" value={stats.viewerCount} icon="viewers" />
      </div>

      {/* ---------- Active / live users ---------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LiveUserCount initialCount={liveCount} />
        <StatCard label="Active in the last 24h" value={activeCounts.last24h} icon="active" />
        <StatCard label="Active in the last 15 days" value={activeCounts.last15Days} icon="active" />
        <StatCard label="Active in the last 30 days" value={activeCounts.last30Days} icon="active" />
      </div>

      {/* ---------- Site visitor stats ---------- */}
      <div className="mt-8 rounded-sm border border-sand bg-paper p-5">
        <h2 className="font-display text-base font-bold text-ink">Site visitors</h2>

        <div className="mt-3">
          <DateRangeTabs activeRange={range} customStart={customStart} customEnd={customEnd} />
        </div>

        <p className="mt-4">
          <span className="font-display text-2xl font-bold text-ink">{visitTrend.total}</span>{" "}
          <span className="text-sm text-stone">
            visitor{visitTrend.total === 1 ? "" : "s"} {RANGE_LABEL[range]}
          </span>
        </p>

        <div className="mt-4">
          <SiteVisitsChart points={visitTrend.points} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownTable title="Top main categories" items={topCategories} />
        <BreakdownTable title="Top cities" items={topCities} />
      </div>
    </div>
  );
}
