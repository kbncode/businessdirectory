import Link from "next/link";
import { List, Megaphone, Eye, MousePointerClick, ArrowRight, CalendarDays, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MakeOfferAction } from "@/components/promotions/MakeOfferAction";
import { BusinessFilterSelect } from "@/components/owner/BusinessFilterSelect";
import { DateRangeTabs } from "@/components/ui/DateRangeTabs";
import { ProfileViewsChart } from "@/components/owner/ProfileViewsChart";
import { PromotionEventsChart } from "@/components/owner/PromotionEventsChart";
import { getViewerSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getUpcomingPublishedEvents } from "@/lib/queries/events";
import {
  getOwnerBusinessOptions,
  resolveOwnerBusinessIds,
  getOwnerSummaryStats,
  getOwnerPromotionIds,
  ownerHasAnyPromotion,
  getProfileViewTrend,
  getPromotionEventTrend,
  resolveDateRange,
  type DateRangePreset,
} from "@/lib/queries/owner-dashboard";

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

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
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

interface Props {
  searchParams: SearchParams;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getViewerSession();
  // Middleware already redirects an unauthenticated visit to /login, but
  // session.user.id is needed below regardless.
  if (!session?.user?.id) return null;
  const ownerId = session.user.id;

  const requestedBusinessId = first(searchParams.business) ?? null;
  const rawRange = first(searchParams.range);
  const range: DateRangePreset = rawRange && VALID_PRESETS.has(rawRange as DateRangePreset) ? (rawRange as DateRangePreset) : "week";
  const customStart = first(searchParams.start) ?? "";
  const customEnd = first(searchParams.end) ?? "";

  const [businesses, businessIds, hasAnyPromotion, upcomingEvents] = await Promise.all([
    getOwnerBusinessOptions(ownerId),
    resolveOwnerBusinessIds(ownerId, requestedBusinessId),
    ownerHasAnyPromotion(ownerId),
    getUpcomingPublishedEvents(),
  ]);

  const selectedBusinessId =
    requestedBusinessId && businesses.some((b) => b.id === requestedBusinessId) ? requestedBusinessId : "all";

  const dateRange = resolveDateRange(range, { start: customStart, end: customEnd });

  const [summary, promotionIds] = await Promise.all([
    getOwnerSummaryStats(businessIds),
    getOwnerPromotionIds(businessIds),
  ]);

  const [viewTrend, eventTrend] = await Promise.all([
    getProfileViewTrend(businessIds, dateRange),
    getPromotionEventTrend(promotionIds, dateRange),
  ]);

  const ctr = eventTrend.totalImpressions > 0 ? (eventTrend.totalClicks / eventTrend.totalImpressions) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-stone">An overview of your listings and offers.</p>
        </div>
        {businesses.length > 1 && <BusinessFilterSelect businesses={businesses} selected={selectedBusinessId} />}
      </div>

      {/* ---------- Summary cards ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={List} value={summary.activeListings} label="Active listings" />
        <StatCard icon={Megaphone} value={summary.activeOffers} label="Active offers" />
        <StatCard icon={Eye} value={summary.totalProfileViews} label="Total profile views" />
        <StatCard icon={MousePointerClick} value={summary.totalOfferImpressions} label="Total offer impressions" />
      </div>

      {/* ---------- Date range ---------- */}
      <div className="mt-10">
        <DateRangeTabs activeRange={range} customStart={customStart} customEnd={customEnd} />
      </div>

      {/* ---------- Profile views ---------- */}
      <section className="mt-6 rounded-sm border border-sand bg-paper p-5">
        <h2 className="font-display text-base font-bold text-ink">Profile views</h2>
        <p className="mt-1">
          <span className="font-display text-2xl font-bold text-ink">{viewTrend.total}</span>{" "}
          <span className="text-sm text-stone">
            profile view{viewTrend.total === 1 ? "" : "s"} {RANGE_LABEL[range]}
          </span>
        </p>
        <div className="mt-4">
          <ProfileViewsChart points={viewTrend.points} />
        </div>
      </section>

      {/* ---------- Offer / ad performance ---------- */}
      <section className="mt-6 rounded-sm border border-sand bg-paper p-5">
        <h2 className="font-display text-base font-bold text-ink">Offer &amp; ad performance</h2>

        {!hasAnyPromotion ? (
          <div className="mt-4 flex flex-col items-start gap-3">
            <p className="text-sm text-stone">You haven&apos;t created any offers yet.</p>
            <MakeOfferAction ownerId={ownerId} />
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-8">
              <div>
                <p className="font-display text-2xl font-bold text-ink">{eventTrend.totalImpressions}</p>
                <p className="text-xs text-stone">Impressions {RANGE_LABEL[range]}</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-ink">{eventTrend.totalClicks}</p>
                <p className="text-xs text-stone">Click-throughs {RANGE_LABEL[range]}</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-ink">{ctr.toFixed(1)}%</p>
                <p className="text-xs text-stone">Click-through rate</p>
              </div>
            </div>
            <div className="mt-4">
              <PromotionEventsChart points={eventTrend.points} />
            </div>
          </>
        )}
      </section>

      {/* ---------- Upcoming events (site-wide, not owner-scoped) ---------- */}
      {upcomingEvents.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">Upcoming events</h2>
            <Link href="/events" className="flex items-center gap-1 text-sm font-medium text-ink hover:underline">
              View all events
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {upcomingEvents.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="flex items-center gap-4 rounded-sm border border-sand bg-paper p-3 transition-colors hover:border-signalOrange"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-sand">
                  {event.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Blob-hosted photo, host not known ahead of time
                    <img src={event.photoUrl} alt={event.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <CalendarDays className="h-5 w-5 text-stone" strokeWidth={1.75} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-ink">{event.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-stone">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    {formatDateTime(event.eventDate)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-ink underline">View details</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
