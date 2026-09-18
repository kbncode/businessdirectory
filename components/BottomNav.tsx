"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, List, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
  { href: "/browse", label: "Browse", icon: Compass, match: (path: string) => path.startsWith("/browse") },
  {
    href: "/my-listings",
    label: "My Listings",
    icon: List,
    match: (path: string) => path.startsWith("/my-listings"),
  },
  { href: "/profile", label: "Profile", icon: CircleUser, match: (path: string) => path.startsWith("/profile") },
];

// "My Listings" and "Profile" require a logged-in viewer, same as visiting
// those URLs directly — the middleware already redirects to /login with a
// callbackUrl back to the tapped tab (see middleware.ts), so this component
// stays a plain nav with no auth awareness of its own: every tab always
// looks equally tappable, and the gate happens server-side on navigation.
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-signalOrange" : "text-stone"
              )}
            >
              <tab.icon className="h-5 w-5" strokeWidth={1.75} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
