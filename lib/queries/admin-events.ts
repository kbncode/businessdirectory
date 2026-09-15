import { prisma } from "@/lib/prisma";
import type { EventFormValues } from "@/lib/event-validation";

export async function getEventsForAdmin() {
  return prisma.event.findMany({ orderBy: { eventDate: "desc" } });
}

export async function getEventForAdmin(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

interface PhotoUpdate {
  photoUrl: string;
}

function toData(values: EventFormValues) {
  return {
    title: values.title.trim(),
    slug: values.slug,
    description: values.description,
    eventDate: new Date(values.eventDate),
    endDate: values.endDate ? new Date(values.endDate) : null,
    location: values.location.trim() || null,
    contactName: values.contactName.trim() || null,
    contactPhone: values.contactPhone.trim() || null,
    contactEmail: values.contactEmail.trim() || null,
    isFeatured: values.isFeatured,
    status: values.status,
  };
}

export async function createEvent(values: EventFormValues, photo?: PhotoUpdate) {
  return prisma.event.create({
    data: { ...toData(values), ...(photo ? { photoUrl: photo.photoUrl } : {}) },
  });
}

export interface UpdateEventResult {
  ok: true;
  event: Awaited<ReturnType<typeof getEventForAdmin>>;
}
export interface UpdateEventError {
  ok: false;
  error: string;
}

export async function updateEvent(
  id: string,
  values: EventFormValues,
  photo?: PhotoUpdate
): Promise<UpdateEventResult | UpdateEventError> {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Event not found." };

  if (values.slug !== existing.slug) {
    const collision = await prisma.event.findFirst({ where: { slug: values.slug, id: { not: id } } });
    if (collision) return { ok: false, error: `Slug "${values.slug}" is already in use.` };
  }

  const event = await prisma.event.update({
    where: { id },
    data: { ...toData(values), ...(photo ? { photoUrl: photo.photoUrl } : {}) },
  });

  return { ok: true, event };
}

export async function setEventFeatured(id: string, isFeatured: boolean) {
  return prisma.event.update({ where: { id }, data: { isFeatured } });
}

export async function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } });
}
