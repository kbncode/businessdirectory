import { prisma } from "@/lib/prisma";

const ACTIVITY_THROTTLE_MS = 60 * 1000;

// Called from the root layout on every page load for a signed-in viewer —
// throttled via the WHERE clause itself (only writes if the existing value
// is null or stale by more than a minute) so a user rapidly navigating the
// site doesn't turn into a write on every single request. This is a
// best-effort presence signal for the admin dashboard's "live now" count,
// not a precise activity log — a lost race under concurrent requests just
// means one extra write, never a correctness problem.
export async function touchViewerActivity(userId: string): Promise<void> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - ACTIVITY_THROTTLE_MS);

  await prisma.user.updateMany({
    where: { id: userId, OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: staleBefore } }] },
    data: { lastActiveAt: now },
  });
}
