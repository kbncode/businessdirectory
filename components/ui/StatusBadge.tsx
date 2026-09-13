import type { BusinessStatus } from "@prisma/client";
import { Badge } from "./Badge";

const STATUS_CONFIG: Record<BusinessStatus, { label: string; variant: "pending" | "approved" | "rejected" }> = {
  PENDING: { label: "Pending review", variant: "pending" },
  APPROVED: { label: "Approved", variant: "approved" },
  REJECTED: { label: "Rejected", variant: "rejected" },
};

export function StatusBadge({ status }: { status: BusinessStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
