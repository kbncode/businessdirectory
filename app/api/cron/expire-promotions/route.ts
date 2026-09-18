import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Runs daily via vercel.json's cron entry. This is housekeeping only — it
// keeps the *stored* Promotion.status tidy (so admin's "All Promotions"
// list shows "Expired" instead of a stale "Approved") and does not affect
// public visibility, which is already enforced live by
// getPublishedPromotionWhere() in lib/queries/promotions.ts regardless of
// whether this has run yet.
export async function GET(request: Request) {
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` on every
  // invocation once CRON_SECRET is set as an env var — this is how Vercel
  // itself authenticates the request, not a custom scheme. Falling back to
  // a ?secret= query param too, for manual/local testing via curl or a
  // browser where setting a header isn't convenient.
  const authHeader = request.headers.get("authorization");
  const secretParam = new URL(request.url).searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }
  if (authHeader !== `Bearer ${expected}` && secretParam !== expected) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const result = await prisma.promotion.updateMany({
    where: { status: "APPROVED", endDate: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ expired: result.count });
}
