import { Badge } from "@/components/ui/Badge";
import type { ViewerListingStatus } from "@/lib/queries/viewer-users";

const CONFIG: Record<ViewerListingStatus, { label: string; variant: "approved" | "rejected" | "pending" }> = {
  active: { label: "Active", variant: "approved" },
  deleted: { label: "Deleted", variant: "rejected" },
  not_listed: { label: "Not listed", variant: "pending" },
};

export function ViewerListingBadge({ status }: { status: ViewerListingStatus }) {
  const config = CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
