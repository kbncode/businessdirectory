"use client";

// Shared fire-and-forget sender for the /api/track/* routes — sendBeacon is
// preferred (survives page unload, e.g. a click that immediately
// navigates), with a keepalive fetch fallback for contexts where it's
// unavailable or the browser can't queue it (e.g. payload too large,
// browser is blocking beacons to this origin). Never awaited by callers —
// a tracking call must not delay or block anything.
export function sendTrackingBeacon(url: string, payload: unknown) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const sent = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    if (sent) return;
  }

  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}
