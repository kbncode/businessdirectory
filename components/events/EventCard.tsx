import Link from "next/link";
import type { Event } from "@prisma/client";
import { CalendarDays, MapPin, CalendarClock } from "lucide-react";
import { formatDateTime } from "@/lib/format";

function excerpt(html: string, maxLength: number) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-sand bg-paper transition-shadow hover:shadow-md"
    >
      <div className="h-1 w-full bg-transparent transition-colors group-hover:bg-signalOrange" />

      <div className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-sand">
        {event.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Blob-hosted photo, host not known ahead of time
          <img src={event.photoUrl} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stone/30 bg-paper">
              <CalendarDays className="h-5 w-5 text-stone" strokeWidth={1.75} />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="font-display text-lg font-bold leading-snug text-ink">{event.title}</span>
        <span className="flex items-center gap-1 font-body text-sm text-stone">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {formatDateTime(event.eventDate)}
        </span>
        {event.location && (
          <span className="flex items-center gap-1 font-body text-sm text-stone">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            {event.location}
          </span>
        )}
        <p className="line-clamp-2 font-body text-sm text-stone">{excerpt(event.description, 140)}</p>
      </div>
    </Link>
  );
}
