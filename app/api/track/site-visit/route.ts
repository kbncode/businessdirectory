import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewerSession } from "@/lib/auth";
import { getOrCreateVisitorKey, startOfUtcDay } from "@/lib/visitor";

// Same "never fail loudly" contract as the other /api/track/* routes —
// always 200. No businessId/promotionId here since this is a site-wide
// hit, not scoped to any one listing.
export const runtime = "nodejs";

export async function POST() {
  try {
    const viewerSession = await getViewerSession();
    const visitorKey = getOrCreateVisitorKey(viewerSession?.user?.id ?? null);
    const viewDate = startOfUtcDay();

    await prisma.siteVisit.upsert({
      where: { visitorKey_viewDate: { visitorKey, viewDate } },
      update: {},
      create: { visitorKey, viewDate },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to record site visit:", error);
    return NextResponse.json({ ok: true });
  }
}
