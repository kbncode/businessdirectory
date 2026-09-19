"use client";

import { useEffect } from "react";
import { sendTrackingBeacon } from "@/lib/beacon";

// Same once-per-mount / server-side-dedupe contract as TrackBusinessView.
export function TrackPromotionImpression({ promotionId }: { promotionId: string }) {
  useEffect(() => {
    sendTrackingBeacon("/api/track/promotion-event", { promotionId, eventType: "IMPRESSION" });
  }, [promotionId]);

  return null;
}
