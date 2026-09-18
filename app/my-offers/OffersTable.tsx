"use client";

import { useState } from "react";
import type { Promotion } from "@prisma/client";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { PromotionStatusBadge } from "@/components/promotions/PromotionStatusBadge";
import { PROMOTION_TYPES } from "@/lib/promotion-validation";
import { getPromotionDisplayStatus, isActivePromotion } from "@/lib/promotion-status";
import { formatDate } from "@/lib/format";

type PromotionWithBusiness = Promotion & { business: { businessName: string; slug: string } };

const TYPE_LABEL: Record<string, string> = Object.fromEntries(PROMOTION_TYPES.map((t) => [t.value, t.label]));

export function OffersTable({ initialPromotions }: { initialPromotions: PromotionWithBusiness[] }) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<AdminToastValue | null>(null);

  async function removePromotion(promotion: PromotionWithBusiness) {
    if (!window.confirm(`End "${promotion.title}" now? This can't be undone.`)) return;

    setBusyId(promotion.id);
    try {
      const res = await fetch(`/api/my-offers/${promotion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REMOVED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to remove promotion.", tone: "error" });
        return;
      }
      setPromotions((prev) =>
        prev.map((p) => (p.id === promotion.id ? { ...p, status: "REMOVED", removedAt: new Date() } : p))
      );
      setToast({ message: `"${promotion.title}" has been removed.`, tone: "success" });
    } catch {
      setToast({ message: "Failed to remove promotion.", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      <ul className="flex flex-col gap-3">
        {promotions.map((promotion) => {
          const displayStatus = getPromotionDisplayStatus(promotion);
          const canRemove = displayStatus === "APPROVED" && isActivePromotion(promotion);

          return (
            <li key={promotion.id} className="rounded-sm border border-sand bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-ink">{promotion.title}</p>
                  <p className="text-sm text-stone">
                    {TYPE_LABEL[promotion.type]} &middot; {promotion.business.businessName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <PromotionStatusBadge status={promotion.status} endDate={promotion.endDate} />
                    <span className="text-xs text-stone">
                      {formatDate(promotion.startDate)} – {formatDate(promotion.endDate)}
                    </span>
                  </div>
                  {promotion.status === "REJECTED" && promotion.rejectionReason && (
                    <p className="mt-2 text-xs text-rejectedRed">Reason: {promotion.rejectionReason}</p>
                  )}
                </div>

                {canRemove && (
                  <button
                    type="button"
                    disabled={busyId === promotion.id}
                    onClick={() => removePromotion(promotion)}
                    className="shrink-0 rounded-sm border border-ink px-3 py-1.5 text-xs text-ink transition-colors hover:bg-sand disabled:opacity-40"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
