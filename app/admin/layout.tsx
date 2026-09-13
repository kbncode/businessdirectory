import Image from "next/image";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { signOut } from "@/lib/auth-admin";
import { getPendingCount } from "@/lib/queries/admin-business";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const pendingCount = session?.user ? await getPendingCount() : 0;

  if (!session?.user) {
    return <div className="min-h-screen bg-paper">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sand bg-sand/20 md:flex">
        <div className="border-b border-sand px-5 py-5">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="/kbn-logo.png"
              alt="KBN"
              height={32}
              width={0}
              sizes="100vw"
              style={{ height: "32px", width: "auto" }}
            />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-signalOrange">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AdminSidebarNav pendingCount={pendingCount} />
        </div>

        <div className="border-t border-sand px-5 py-4">
          <p className="text-xs text-stone">Signed in as</p>
          <p className="truncate text-sm font-medium text-ink">{session.user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="mt-3 w-full rounded-sm border border-ink px-3 py-1.5 text-sm text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-sand bg-paper px-4 py-3 md:hidden">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="/kbn-logo.png"
              alt="KBN"
              height={28}
              width={0}
              sizes="100vw"
              style={{ height: "28px", width: "auto" }}
            />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-signalOrange">
              Admin
            </span>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-sm border border-ink px-3 py-1.5 text-xs text-ink hover:bg-ink hover:text-paper"
            >
              Log out
            </button>
          </form>
        </div>
        <AdminMobileNav pendingCount={pendingCount} />

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
