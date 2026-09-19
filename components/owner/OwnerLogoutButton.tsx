import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-viewer";

// Deliberately a plain Server Component (no "use client") — the form's
// action is a server action, same inline-form pattern as app/admin/layout.tsx.
// Rendered directly in the desktop sidebar and passed as a prop into the
// (client) mobile drawer, rather than imported into it — a Server Component
// can be handed to a Client Component as a child/prop, just not imported by
// one.
export function OwnerLogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-stone transition-colors hover:bg-sand/60 hover:text-ink"
      >
        <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        Logout
      </button>
    </form>
  );
}
