"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendTrackingBeacon } from "@/lib/beacon";

// Rendered once, in the root layout, only for non-admin pages — fires once
// per client-side navigation. Same server-side upsert-dedup as the other
// tracking routes makes repeat hits from the same visitor on the same day
// a no-op, so this doesn't need its own dedup logic here.
export function TrackSiteVisit() {
  const pathname = usePathname();

  useEffect(() => {
    sendTrackingBeacon("/api/track/site-visit", {});
  }, [pathname]);

  return null;
}
