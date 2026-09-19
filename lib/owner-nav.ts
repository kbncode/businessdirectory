import { LayoutDashboard, List, Megaphone, CircleUser } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// The dashboard shell's nav list — a plain config, not hardcoded JSX, so a
// future module (e.g. Analytics) is added by appending one entry here and
// nowhere else; both OwnerSidebarNav (desktop) and the mobile drawer render
// from this same array.
export interface OwnerNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const OWNER_NAV_ITEMS: OwnerNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Listings", href: "/my-listings", icon: List },
  { label: "My Offers", href: "/my-offers", icon: Megaphone },
  { label: "Profile", href: "/profile", icon: CircleUser },
];
