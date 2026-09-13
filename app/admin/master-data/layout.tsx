"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { slug: "countries", label: "Countries" },
  { slug: "states", label: "States" },
  { slug: "cities", label: "Cities" },
  { slug: "business-entities", label: "Business Entities" },
  { slug: "business-types", label: "Business Types" },
  { slug: "business-main-categories", label: "Main Categories" },
  { slug: "business-sub-categories", label: "Sub-Categories" },
];

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Master Data</h1>

      <nav className="mt-4 flex flex-wrap gap-2 border-b border-sand pb-3">
        {TABS.map((tab) => {
          const href = `/admin/master-data/${tab.slug}`;
          const isActive = pathname === href;
          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                isActive ? "bg-signalOrange text-ink" : "text-stone hover:bg-sand hover:text-ink"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
