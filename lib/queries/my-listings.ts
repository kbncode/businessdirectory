import { prisma } from "@/lib/prisma";

// Viewer-facing queries scoped to "businesses this signed-in user submitted"
// — deliberately separate from lib/queries/business.ts (public, APPROVED
// only) and lib/queries/admin-business.ts (admin, no ownership filter).

export async function getMyListings(ownerId: string) {
  return prisma.business.findMany({
    where: { submittedById: ownerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      businessName: true,
      photoUrl: true,
      city: true,
      status: true,
      rejectionReason: true,
      createdAt: true,
      mainCategory: { select: { name: true } },
    },
  });
}

// Full record, scoped by ownerId so a viewer can never fetch (or edit)
// someone else's listing by guessing an id.
export async function getMyListingById(id: string, ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      mainCategory: true,
      entity: true,
      type: true,
      country: true,
      state: true,
      subCategories: { include: { subCategory: true } },
    },
  });

  if (!business || business.submittedById !== ownerId) return null;
  return business;
}
