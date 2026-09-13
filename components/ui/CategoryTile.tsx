import Link from "next/link";
import { getCategoryIcon } from "@/lib/category-icons";

export interface CategoryTileProps {
  label: string;
  href: string;
}

export function CategoryTile({ label, href }: CategoryTileProps) {
  const Icon = getCategoryIcon(label);

  return (
    <Link
      href={href}
      className="flex h-[124px] flex-col items-center justify-center gap-2.5 rounded-sm border border-sand bg-paper px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-signalOrange hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-sand">
        <Icon className="h-5 w-5 text-ink" strokeWidth={1.75} />
      </span>
      <span className="line-clamp-2 font-body text-sm font-medium leading-snug text-ink">{label}</span>
    </Link>
  );
}
