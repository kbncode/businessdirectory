import { cookies } from "next/headers";
import { randomUUID } from "crypto";

// Only used server-side, inside a Route Handler — next/headers' cookies()
// is only writable there (or in a Server Action), not during a Server
// Component render.

const VISITOR_COOKIE = "kbn_vid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// The identity used to dedupe view/impression/click rows for one calendar
// day. A logged-in viewer's own userId is preferred over the anonymous
// cookie so their activity stays consistent across devices/browsers — the
// cookie is only the fallback for a signed-out visitor.
export function getOrCreateVisitorKey(userId?: string | null): string {
  if (userId) return userId;

  const store = cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;

  const generated = randomUUID();
  // Not httpOnly — the client-side beacon reads/relies on this cookie
  // existing, same as any other same-origin request; nothing sensitive is
  // stored in it (just an opaque random id).
  store.set(VISITOR_COOKIE, generated, {
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return generated;
}

// Truncates "now" to midnight UTC — the day component of the
// (businessId/promotionId, visitorKey, day) unique constraint that makes a
// same-day repeat hit an upsert no-op instead of a duplicate row.
export function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
