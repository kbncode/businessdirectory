import { EventEditor } from "../EventEditor";

export default function AdminNewEventPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Add new event</h1>

      <div className="mt-6 rounded-sm border border-sand bg-paper p-6">
        <EventEditor mode="create" />
      </div>
    </div>
  );
}
