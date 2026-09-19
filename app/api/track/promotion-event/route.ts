import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewerSession, getAdminSession } from "@/lib/auth";
import { getOrCreateVisitorKey, startOfUtcDay } from "@/lib/visitor";

// Same "never fail loudly" contract as business-view — always 200.
export const runtime = "nodejs";

const VALID_EVENT_TYPES = new Set(["IMPRESSION", "CLICK"]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const promotionId = typeof body?.promotionId === "string" ? body.promotionId : null;
    const eventType = typeof body?.eventType === "string" ? body.eventType : null;
    if (!promotionId || !eventType || !VALID_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ ok: true });
    }

    const [viewerSession, adminSession] = await Promise.all([getViewerSession(), getAdminSession()]);
    if (adminSession?.user) return NextResponse.json({ ok: true });

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
      select: { business: { select: { submittedById: true } } },
    });
    if (!promotion) return NextResponse.json({ ok: true });

    // The owner viewing/clicking their own promotion doesn't count.
    if (viewerSession?.user?.id && viewerSession.user.id === promotion.business.submittedById) {
      return NextResponse.json({ ok: true });
    }

    const visitorKey = getOrCreateVisitorKey(viewerSession?.user?.id ?? null);
    const eventDate = startOfUtcDay();

    await prisma.promotionEvent.upsert({
      where: {
        promotionId_eventType_visitorKey_eventDate: {
          promotionId,
          eventType: eventType as "IMPRESSION" | "CLICK",
          visitorKey,
          eventDate,
        },
      },
      update: {},
      create: { promotionId, eventType: eventType as "IMPRESSION" | "CLICK", visitorKey, eventDate },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to record promotion event:", error);
    return NextResponse.json({ ok: true });
  }
}
