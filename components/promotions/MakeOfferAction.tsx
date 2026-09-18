import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getMyApprovedBusinesses } from "@/lib/queries/promotions";

interface MakeOfferActionProps {
  ownerId: string;
  className?: string;
}

// Shared between /profile and /my-listings — same eligibility rule either
// place: at least one APPROVED business is required before an owner can
// submit a promotion at all.
export async function MakeOfferAction({ ownerId, className }: MakeOfferActionProps) {
  const approvedBusinesses = await getMyApprovedBusinesses(ownerId);

  if (approvedBusinesses.length === 0) {
    return (
      <p className={cn("rounded-sm border border-sand bg-sand/30 px-4 py-3 text-sm text-stone", className)}>
        You need an approved business listing before you can create a promotion.
      </p>
    );
  }

  return (
    <Link href="/my-offers/new" className={cn(buttonClasses("primary"), className)}>
      Make an Offer
    </Link>
  );
}
