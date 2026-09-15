import { notFound } from "next/navigation";
import { getEventForAdmin } from "@/lib/queries/admin-events";
import { EventEditor } from "../../EventEditor";

export default async function AdminEditEventPage({ params }: { params: { id: string } }) {
  const event = await getEventForAdmin(params.id);
  if (!event) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Edit event</h1>
      <p className="mt-1 text-sm text-stone">{event.title}</p>

      <div className="mt-6 rounded-sm border border-sand bg-paper p-6">
        <EventEditor mode="edit" event={event} />
      </div>
    </div>
  );
}
