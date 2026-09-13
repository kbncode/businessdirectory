import { CheckCircle2, Clock, XCircle, Users } from "lucide-react";
import { getDashboardStats, getTopMainCategories, getTopCities, type BreakdownItem } from "@/lib/queries/admin-dashboard";

const STAT_ICONS = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
  viewers: Users,
} as const;

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

export default async function AdminDashboardPage() {
  const [stats, topCategories, topCities] = await Promise.all([
    getDashboardStats(),
    getTopMainCategories(10),
    getTopCities(10),
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownTable title="Top main categories" items={topCategories} />
        <BreakdownTable title="Top cities" items={topCities} />
      </div>
    </div>
  );
}
