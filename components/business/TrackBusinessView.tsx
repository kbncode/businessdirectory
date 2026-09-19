"use client";

import { useEffect } from "react";
import { sendTrackingBeacon } from "@/lib/beacon";

// Fires once per mount — a page refresh re-mounts and fires again, but the
// server-side upsert on (businessId, visitorKey, today) dedupes that down
// to a single row per visitor per day, so a no-op on a same-day repeat is
// expected, not a bug in this component.
export function TrackBusinessView({ businessId }: { businessId: string }) {
  useEffect(() => {
    sendTrackingBeacon("/api/track/business-view", { businessId });
  }, [businessId]);

  return null;
}
