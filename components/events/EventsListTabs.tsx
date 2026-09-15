"use client";

import { useState } from "react";
import type { Event } from "@prisma/client";
import { CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventCard } from "./EventCard";

interface EventsListTabsProps {
  upcoming: Event[];
  past: Event[];
}

export function EventsListTabs({ upcoming, past }: EventsListTabsProps) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const events = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      <div className="flex gap-2">
        {(["upcoming", "past"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
              tab === value ? "bg-signalOrange text-ink" : "bg-sand text-stone hover:text-ink"
            )}
          >
            {value === "upcoming" ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-sm border border-sand bg-sand/20 py-16 text-center">
          <CalendarX className="h-8 w-8 text-stone" strokeWidth={1.75} />
          <p className="text-sm text-stone">
            {tab === "upcoming" ? "No upcoming events scheduled — check back soon." : "No past events to show."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
