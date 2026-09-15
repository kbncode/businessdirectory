import { prisma } from "@/lib/prisma";

// Public-facing Event reads only — always scoped to status: PUBLISHED.
// Deliberately separate from lib/queries/admin-events.ts (draft-visible,
// mutation-capable) so nothing here can accidentally leak a draft.

export async function getPublishedEventBySlug(slug: string) {
  return prisma.event.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function getUpcomingPublishedEvents() {
  return prisma.event.findMany({
    where: { status: "PUBLISHED", eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
  });
}

export async function getPastPublishedEvents() {
  return prisma.event.findMany({
    where: { status: "PUBLISHED", eventDate: { lt: new Date() } },
    orderBy: { eventDate: "desc" },
  });
}

export async function getFeaturedUpcomingEvents(limit = 3) {
  return prisma.event.findMany({
    where: { status: "PUBLISHED", isFeatured: true, eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
    take: limit,
  });
}
