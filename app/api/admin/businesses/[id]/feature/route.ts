import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_FEATURED_LISTINGS, countActiveFeaturedBusinesses } from "@/lib/queries/business";

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const isFeatured = Boolean(body?.isFeatured);

  const featuredStartDate = parseDate(body?.featuredStartDate);
  const featuredEndDate = parseDate(body?.featuredEndDate);
  if (featuredStartDate === undefined || featuredEndDate === undefined) {
    return NextResponse.json({ error: "Invalid start or end date." }, { status: 400 });
  }
  if (featuredStartDate && featuredEndDate && featuredStartDate > featuredEndDate) {
    return NextResponse.json({ error: "Start date must be before the end date." }, { status: 400 });
  }

  if (isFeatured) {
    if (business.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved listings can be featured." },
        { status: 400 }
      );
    }

    const activeCount = await countActiveFeaturedBusinesses(business.id);
    if (activeCount >= MAX_FEATURED_LISTINGS) {
      return NextResponse.json(
        {
          error: `Maximum of ${MAX_FEATURED_LISTINGS} featured listings reached (${activeCount}/${MAX_FEATURED_LISTINGS}). Un-feature another listing first.`,
        },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.business.update({
    where: { id: params.id },
    data: { isFeatured, featuredStartDate, featuredEndDate },
  });

  return NextResponse.json({ business: updated });
}
