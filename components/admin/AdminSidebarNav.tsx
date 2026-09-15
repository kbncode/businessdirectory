"use client";

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
  FileText,
  Menu as MenuIcon,
  PanelBottom,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pending", label: "Pending Review", icon: Clock, badgeKey: "pending" as const },
  { href: "/admin/listings", label: "All Listings", icon: List },
  { href: "/admin/users", label: "Users", icon: UserRound },
  { href: "/admin/master-data", label: "Master Data", icon: Database },
  { href: "/admin/admin-users", label: "Admin Users", icon: Users },
  { href: "/admin/hero-images", label: "Hero Images", icon: ImageIcon },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/header-menu", label: "Header Menu", icon: MenuIcon },
  { href: "/admin/footer", label: "Footer", icon: PanelBottom },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebarNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badge = item.badgeKey === "pending" ? pendingCount : 0;

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
      })}
    </nav>
  );
}
