import type { Metadata } from "next";
import { getUpcomingPublishedEvents, getPastPublishedEvents } from "@/lib/queries/events";
import { EventsListTabs } from "@/components/events/EventsListTabs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingPublishedEvents(), getPastPublishedEvents()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Events</h1>
      <p className="mt-2 text-sm text-stone">Community events from KBN Business Directory.</p>

      <div className="mt-8">
        <EventsListTabs upcoming={upcoming} past={past} />
      </div>
    </div>
  );
}
