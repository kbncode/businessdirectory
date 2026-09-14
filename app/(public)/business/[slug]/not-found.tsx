import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function BusinessNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Business not found</h1>
      <p className="mt-2 text-sm text-stone">This listing doesn&apos;t exist or hasn&apos;t been approved yet.</p>
      <Link href="/browse" className={cn(buttonClasses("primary"), "mt-6 inline-flex")}>
        Browse businesses
      </Link>
    </div>
  );
}
