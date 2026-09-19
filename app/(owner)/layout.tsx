import { getViewerSession } from "@/lib/auth";
import { OwnerSidebarNav } from "@/components/owner/OwnerSidebarNav";
import { OwnerMobileNav } from "@/components/owner/OwnerMobileNav";
import { OwnerLogoutButton } from "@/components/owner/OwnerLogoutButton";
import { SectionDivider } from "@/components/ui/SectionDivider";

// Covers /dashboard, /my-listings, /my-offers, /profile — middleware.ts
// already redirects a logged-out visit to /login with a callbackUrl before
// this layout ever renders; the check below is only a defensive fallback,
// same convention as app/admin/layout.tsx.
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getViewerSession();
  if (!session?.user) return <div className="min-h-screen bg-paper">{children}</div>;

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sand bg-paper md:flex">
        <div className="border-b border-sand px-5 py-5">
          <span className="font-display text-xs font-bold uppercase tracking-widest text-signalOrange">
            My Account
          </span>
          <p className="mt-1 truncate text-sm font-medium text-ink">{session.user.name ?? session.user.email}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <OwnerSidebarNav />
        </div>

        <SectionDivider />
        <div className="px-3 py-4">
          <OwnerLogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <OwnerMobileNav logoutSlot={<OwnerLogoutButton />} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
