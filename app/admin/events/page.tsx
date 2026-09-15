import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { getEventsForAdmin } from "@/lib/queries/admin-events";
import { EventsTable } from "./EventsTable";

export default async function AdminEventsPage() {
  const events = await getEventsForAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">Events</h1>
        <Link href="/admin/events/new" className={buttonClasses("primary")}>
          Add new event
        </Link>
      </div>

      <div className="mt-6">
        <EventsTable events={events} />
      </div>
    </div>
  );
}
