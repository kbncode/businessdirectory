import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, User, Phone, Mail, CalendarDays } from "lucide-react";
import { RichContent } from "@/components/cms/RichContent";
import { getPublishedEventBySlug } from "@/lib/queries/events";
import { formatDateTime } from "@/lib/format";

export const revalidate = 300;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getPublishedEventBySlug(params.slug);
  if (!event) notFound();

  return { title: event.title };
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getPublishedEventBySlug(params.slug);
  if (!event) notFound();

  const hasContact = event.contactName || event.contactPhone || event.contactEmail;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <div className="aspect-[16/7] w-full overflow-hidden rounded-sm border border-sand bg-sand">
        {event.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Blob-hosted photo, host not known ahead of time
          <img src={event.photoUrl} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CalendarDays className="h-10 w-10 text-stone" strokeWidth={1.75} />
          </div>
        )}
      </div>

      <h1 className="mt-8 font-display text-3xl font-bold text-ink sm:text-4xl">{event.title}</h1>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {formatDateTime(event.eventDate)}
          {event.endDate ? ` – ${formatDateTime(event.endDate)}` : ""}
        </span>
        {event.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {event.location}
          </span>
        )}
      </div>

      <div className="mt-8">
        <RichContent html={event.description} />
      </div>

      {hasContact && (
        <div className="mt-8 rounded-sm border border-sand bg-sand/20 p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Contact</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-ink">
            {event.contactName && (
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.75} />
                {event.contactName}
              </span>
            )}
            {event.contactPhone && (
              <a href={`tel:${event.contactPhone}`} className="inline-flex items-center gap-2 hover:text-signalOrange">
                <Phone className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.75} />
                {event.contactPhone}
              </a>
            )}
            {event.contactEmail && (
              <a href={`mailto:${event.contactEmail}`} className="inline-flex items-center gap-2 hover:text-signalOrange">
                <Mail className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.75} />
                {event.contactEmail}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
