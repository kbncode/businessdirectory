"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { OwnerSidebarNav } from "@/components/owner/OwnerSidebarNav";
import { SectionDivider } from "@/components/ui/SectionDivider";

// Below md, the persistent sidebar collapses into this hamburger + slide-over
// drawer. The site's bottom tab bar (Home/Browse/My Listings/Profile) stays
// fixed underneath at all times — this only covers the FULL dashboard menu,
// including Dashboard, which isn't one of the bottom tabs.
export function OwnerMobileNav({ logoutSlot }: { logoutSlot: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-sand bg-paper px-4 py-3 md:hidden">
        <span className="font-display text-sm font-bold uppercase tracking-widest text-ink">My Account</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-sand text-ink"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-paper shadow-lg">
            <div className="flex items-center justify-between border-b border-sand px-4 py-3">
              <span className="font-display text-sm font-bold uppercase tracking-widest text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-sm text-ink"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <OwnerSidebarNav onNavigate={() => setOpen(false)} />
            </div>

            <SectionDivider />
            <div className="px-3 py-4">{logoutSlot}</div>
          </div>
        </div>
      )}
    </>
  );
}
