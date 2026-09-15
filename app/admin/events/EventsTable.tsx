"use client";

import { useState } from "react";
import Link from "next/link";
import type { Event } from "@prisma/client";
import { Pencil, Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { formatDateTime } from "@/lib/format";

export function EventsTable({ events: initialEvents }: { events: Event[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<AdminToastValue | null>(null);

  async function toggleFeatured(event: Event) {
    const nextFeatured = !event.isFeatured;
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, isFeatured: nextFeatured } : e)));

    const res = await fetch(`/api/admin/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: nextFeatured }),
    });
    if (!res.ok) {
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, isFeatured: event.isFeatured } : e)));
      setToast({ message: "Failed to update event.", tone: "error" });
    }
  }

  async function deleteEvent(event: Event) {
    if (!window.confirm(`Permanently delete "${event.title}"? This cannot be undone.`)) return;

    setBusyId(event.id);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to delete event.", tone: "error" });
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setToast({ message: `Deleted "${event.title}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to delete event.", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {events.length === 0 ? (
        <p className="text-sm text-stone">No events yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-sand">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-stone">
                <th className="py-2 pl-4 pr-3">Title</th>
                <th className="py-2 pr-3">Event date</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Featured</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-sand bg-paper transition-colors hover:bg-sand/40">
                  <td className="py-2 pl-4 pr-3 text-ink">{event.title}</td>
                  <td className="py-2 pr-3 text-stone">{formatDateTime(event.eventDate)}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={event.status === "PUBLISHED" ? "approved" : "pending"}>
                      {event.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(event)}
                      title={event.isFeatured ? "Remove from home page" : "Feature on home page"}
                      className="rounded-sm p-1.5 text-stone transition-colors hover:bg-sand hover:text-ink"
                    >
                      <Star
                        className="h-4 w-4"
                        strokeWidth={1.75}
                        fill={event.isFeatured ? "currentColor" : "none"}
                        color={event.isFeatured ? "#F06826" : undefined}
                      />
                    </button>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-0.5">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        title="Edit event"
                        aria-label="Edit event"
                        className="rounded-sm p-2 text-stone transition-colors hover:bg-sand hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                      <button
                        type="button"
                        title="Delete event"
                        aria-label="Delete event"
                        disabled={busyId === event.id}
                        onClick={() => deleteEvent(event)}
                        className="rounded-sm p-2 text-rejectedRed transition-colors hover:bg-rejectedRed/10 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
