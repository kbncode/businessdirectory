import Link from "next/link";
import { Building2 } from "lucide-react";

export interface CityTileProps {
  label: string;
  href: string;
  iconUrl: string | null;
}

// Same bordered icon-tile shell as CategoryTile — consistent visual
// language between "Browse by Category" and "Browse by City". The only
// real difference is the icon source: an admin-uploaded image when present,
// falling back to a plain Building2 glyph in the same sand-background
// badge otherwise.
export function CityTile({ label, href, iconUrl }: CityTileProps) {
  return (
    <Link
      href={href}
      className="flex h-[124px] flex-col items-center justify-center gap-2.5 rounded-sm border border-sand bg-paper px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-signalOrange hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-sand">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Blob-hosted icon, host not known ahead of time
          <img src={iconUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-5 w-5 text-ink" strokeWidth={1.75} />
        )}
      </span>
      <span className="line-clamp-2 font-body text-sm font-medium leading-snug text-ink">{label}</span>
    </Link>
  );
}
