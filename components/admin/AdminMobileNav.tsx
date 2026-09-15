"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, List, UserRound, Database, Users, Image as ImageIcon, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pending", label: "Pending", icon: Clock, badgeKey: "pending" as const },
  { href: "/admin/listings", label: "Listings", icon: List },
  { href: "/admin/users", label: "Users", icon: UserRound },
  { href: "/admin/master-data", label: "Master Data", icon: Database },
  { href: "/admin/admin-users", label: "Admin Users", icon: Users },
  { href: "/admin/hero-images", label: "Hero Images", icon: ImageIcon },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Sidebar collapses to this horizontally-scrollable strip below md — same
// light theme, just a different shape for narrow screens.
export function AdminMobileNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-sand bg-paper px-3 py-2 md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badge = item.badgeKey === "pending" ? pendingCount : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-2 text-xs font-medium transition-colors",
              isActive ? "bg-sand text-ink" : "text-stone hover:bg-sand/60 hover:text-ink"
            )}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            {item.label}
            {badge > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-signalOrange px-1 text-[10px] font-bold text-paper">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
