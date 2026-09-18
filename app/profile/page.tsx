import Link from "next/link";
import { CircleUser } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { getViewerSession } from "@/lib/auth";
import { signOut } from "@/lib/auth-viewer";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await getViewerSession();
  // Middleware already redirects an unauthenticated visit to /login, but
  // session.user is needed below regardless.
  if (!session?.user) return null;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Profile</h1>

      <div className="mt-6 flex items-center gap-4 rounded-sm border border-sand bg-paper p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-stone/30 bg-sand">
          <CircleUser className="h-6 w-6 text-stone" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-ink">{session.user.name ?? "—"}</p>
          <p className="truncate text-sm text-stone">{session.user.email}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/my-listings" className={buttonClasses("primary")}>
          My listings
        </Link>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className={cn(buttonClasses("secondary"), "w-full")}>
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
