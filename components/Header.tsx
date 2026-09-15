import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { HeaderSearch } from "@/components/HeaderSearch";
import { getViewerSession } from "@/lib/auth";
import { signOut } from "@/lib/auth-viewer";
import { getActiveHeaderMenuItems } from "@/lib/queries/header-menu";

export async function Header() {
  const [session, menuItems] = await Promise.all([getViewerSession(), getActiveHeaderMenuItems()]);

  return (
    <header className="border-b border-sand bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/kbn-logo.png"
            alt="KBN - Kadiya Business Networking"
            height={48}
            width={0}
            sizes="100vw"
            priority
            style={{ height: "48px", width: "auto" }}
          />
        </Link>

        <HeaderSearch />

        <nav className="ml-auto flex shrink-0 flex-wrap items-center gap-3">
          {menuItems.map((item) => {
            const external = item.linkType === "EXTERNAL";
            return (
              <Link
                key={item.id}
                href={item.href}
                target={external && item.openInNewTab ? "_blank" : undefined}
                rel={external && item.openInNewTab ? "noopener noreferrer" : undefined}
                className={item.isCta ? buttonClasses("primary") : "text-sm font-medium text-ink hover:text-signalOrange"}
              >
                {item.label}
              </Link>
            );
          })}
          {session?.user ? (
            <>
              <span className="hidden text-sm text-ink sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <Link href="/my-listings" className={buttonClasses("ghost")}>
                My listings
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className={buttonClasses("secondary")}>
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost")}>
                Log in
              </Link>
              <Link href="/signup" className={buttonClasses("ghost")}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
