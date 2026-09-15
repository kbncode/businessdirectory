"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  List,
  UserRound,
  Database,
  Users,
  Image as ImageIcon,
  Images,
  FileText,
  CalendarDays,
  Menu as MenuIcon,
  PanelBottom,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pending", label: "Pending Review", icon: Clock, badgeKey: "pending" as const },
  { href: "/admin/listings", label: "All Listings", icon: List },
  { href: "/admin/users", label: "Users", icon: UserRound },
  { href: "/admin/master-data", label: "Master Data", icon: Database },
  { href: "/admin/admin-users", label: "Admin Users", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
];

const CONTENT_NAV_ITEMS = [
  { href: "/admin/hero-images", label: "Hero Images", icon: ImageIcon },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/header-menu", label: "Header Menu", icon: MenuIcon },
  { href: "/admin/footer", label: "Footer", icon: PanelBottom },
];

const SETTINGS_NAV_ITEMS = [{ href: "/admin/settings", label: "Settings", icon: Settings }];

export function AdminSidebarNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const [contentOpen, setContentOpen] = useState(true);

  function isActivePath(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderItem(item: (typeof NAV_ITEMS)[number]) {
    const isActive = isActivePath(item.href);
    const badge = "badgeKey" in item && item.badgeKey === "pending" ? pendingCount : 0;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-sm border-l-2 px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "border-l-signalOrange bg-sand font-semibold text-ink"
            : "border-l-transparent text-stone hover:bg-sand/60 hover:text-ink"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        {badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signalOrange px-1.5 text-xs font-bold text-paper">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map(renderItem)}

      <button
        type="button"
        onClick={() => setContentOpen((prev) => !prev)}
        aria-expanded={contentOpen}
        className="mb-1 mt-4 flex items-center gap-1 px-3 font-display text-xs font-bold uppercase tracking-widest text-stone hover:text-ink"
      >
        <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", !contentOpen && "-rotate-90")} strokeWidth={2} />
        Content
      </button>
      {contentOpen && CONTENT_NAV_ITEMS.map(renderItem)}

      <div className="mt-4 border-t border-sand pt-4">{SETTINGS_NAV_ITEMS.map(renderItem)}</div>
    </nav>
  );
}
