import { Badge } from "@/components/ui/Badge";
import { getPromotionDisplayStatus } from "@/lib/promotion-status";
import type { PromotionStatus } from "@prisma/client";

const CONFIG: Record<ReturnType<typeof getPromotionDisplayStatus>, { label: string; variant: "pending" | "approved" | "rejected" | "category" }> = {
  PENDING: { label: "Pending", variant: "pending" },
  APPROVED: { label: "Approved", variant: "approved" },
  REJECTED: { label: "Rejected", variant: "rejected" },
  EXPIRED: { label: "Expired", variant: "category" },
  REMOVED: { label: "Removed", variant: "rejected" },
};

export function PromotionStatusBadge({ status, endDate }: { status: PromotionStatus; endDate: Date | string }) {
  const displayStatus = getPromotionDisplayStatus({ status, endDate });
  const config = CONFIG[displayStatus];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
