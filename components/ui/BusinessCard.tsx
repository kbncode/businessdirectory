import Link from "next/link";
import { MapPin, Store } from "lucide-react";
import { Badge } from "./Badge";

export interface BusinessCardProps {
  name: string;
  location: string;
  category: string;
  about: string;
  href: string;
  photoUrl?: string | null;
}

export function BusinessCard({ name, location, category, about, href, photoUrl }: BusinessCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-sm border border-sand bg-paper transition-shadow hover:shadow-md"
    >
      <div className="h-1 w-full bg-transparent transition-colors group-hover:bg-signalOrange" />

      <div className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-sand">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, host not known ahead of time
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stone/30 bg-paper">
              <Store className="h-5 w-5 text-stone" strokeWidth={1.75} />
            </span>
            <span className="font-body text-xs text-stone">{name.charAt(0).toUpperCase()} &middot; KBN</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="font-display text-lg font-bold leading-snug text-ink">{name}</span>
        <span className="flex items-center gap-1 font-body text-sm text-stone">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {location}
        </span>
        <Badge variant="category" className="w-fit">
          {category}
        </Badge>
        <p className="line-clamp-1 font-body text-sm text-stone">{about}</p>
      </div>
    </Link>
  );
}
