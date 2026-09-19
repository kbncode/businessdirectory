"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OWNER_NAV_ITEMS } from "@/lib/owner-nav";
import { cn } from "@/lib/utils";

// Shared by the desktop persistent sidebar and the mobile slide-over drawer
// — only the container around it differs between the two.
export function OwnerSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {OWNER_NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-sm border-l-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-l-signalOrange font-bold text-ink"
                : "border-l-transparent text-stone hover:bg-sand/60 hover:text-ink"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
