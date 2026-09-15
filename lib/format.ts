type BusinessLocation = {
  city: string;
  area?: string | null;
  state?: { name: string } | null;
  country: { name: string };
};

export function formatBusinessLocation(business: BusinessLocation) {
  return [business.city, business.state?.name ?? business.country.name].filter(Boolean).join(", ");
}

export function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

// Fixed locale + UTC timezone so server-rendered and client-hydrated output
// are always byte-identical — plain `.toLocaleDateString()` picks up the
// running process's locale/timezone, which differs between the Node SSR
// process and the browser and was causing a real hydration mismatch
// (React discarding the server HTML and re-rendering client-side) on every
// admin table that displayed a date.
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// For pre-filling a <input type="datetime-local"> value. Deliberately reads
// UTC fields (not local ones) so the round-trip through the form is
// timezone-independent, matching formatDate/formatDateTime's UTC-pinned
// display above and the eventDate/endDate values the API stores as-is.
export function toDatetimeLocalValue(date: Date | string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)}KB`;
  return `${(kb / 1024).toFixed(1)}MB`;
}
