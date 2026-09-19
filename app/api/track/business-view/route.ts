import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewerSession, getAdminSession } from "@/lib/auth";
import { getOrCreateVisitorKey, startOfUtcDay } from "@/lib/visitor";

// A tracking beacon must never surface as a user-facing error and should
// respond fast — every failure path below still returns 200, with the
// actual problem (if any) only logged server-side.
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const businessId = typeof body?.businessId === "string" ? body.businessId : null;
    if (!businessId) return NextResponse.json({ ok: true });

    const [viewerSession, adminSession] = await Promise.all([getViewerSession(), getAdminSession()]);
    // An admin is never counted, regardless of which business they're
    // looking at — they browse listings as part of moderating them.
    if (adminSession?.user) return NextResponse.json({ ok: true });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { submittedById: true },
    });
    if (!business) return NextResponse.json({ ok: true });

    // The owner checking their own listing doesn't count as a visitor view.
    if (viewerSession?.user?.id && viewerSession.user.id === business.submittedById) {
      return NextResponse.json({ ok: true });
    }

    const visitorKey = getOrCreateVisitorKey(viewerSession?.user?.id ?? null);
    const viewDate = startOfUtcDay();

    await prisma.businessView.upsert({
      where: { businessId_visitorKey_viewDate: { businessId, visitorKey, viewDate } },
      update: {},
      create: { businessId, visitorKey, viewDate },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to record business view:", error);
    return NextResponse.json({ ok: true });
  }
}
