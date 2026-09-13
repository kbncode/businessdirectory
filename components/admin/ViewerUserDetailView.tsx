import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { formatDate } from "@/lib/format";
import type { getViewerUserForAdmin } from "@/lib/queries/viewer-users";

type ViewerUser = NonNullable<Awaited<ReturnType<typeof getViewerUserForAdmin>>>;

export function ViewerUserDetailView({ user }: { user: ViewerUser }) {
  return (
    <div className="flex flex-col gap-4 text-ink">
      <div>
        <p className="font-display text-lg font-bold text-ink">{user.name ?? "(no name)"}</p>
        <p className="text-sm text-stone">{user.email}</p>
        <p className="mt-1 text-xs text-stone">Signed up {formatDate(user.createdAt)}</p>
      </div>

      <SectionDivider />

      <div>
        <h3 className="font-display text-sm font-bold text-ink">
          Business listings ({user.businesses.length})
        </h3>
        {user.businesses.length === 0 ? (
          <p className="mt-2 text-sm text-stone">This user hasn&apos;t submitted any business listings.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {user.businesses.map((business) => (
              <li
                key={business.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-sand p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/listings/${business.id}/edit`}
                    className="truncate text-sm font-medium text-ink underline decoration-sand hover:decoration-signalOrange"
                  >
                    {business.businessName}
                  </Link>
                  <p className="text-xs text-stone">
                    {business.city} &middot; Submitted {formatDate(business.createdAt)}
                  </p>
                </div>
                <StatusBadge status={business.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
