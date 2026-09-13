import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { HeaderSearch } from "@/components/HeaderSearch";
import { getViewerSession } from "@/lib/auth";
import { signOut } from "@/lib/auth-viewer";

export async function Header() {
  const session = await getViewerSession();

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

        <nav className="ml-auto flex shrink-0 items-center gap-3">
          <Link href="/register" className={buttonClasses("primary")}>
            List your business
          </Link>
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
