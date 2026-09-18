"use client";

import { useState } from "react";
import { Eye, Check, X as XIcon, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PromotionDetailView } from "@/components/admin/PromotionDetailView";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { PROMOTION_TYPES } from "@/lib/promotion-validation";
import { formatDate } from "@/lib/format";
import type { getPendingPromotions, getPromotionForAdmin } from "@/lib/queries/admin-promotions";

type PendingPromotion = Awaited<ReturnType<typeof getPendingPromotions>>[number];
type FullPromotion = NonNullable<Awaited<ReturnType<typeof getPromotionForAdmin>>>;

const TYPE_LABEL: Record<string, string> = Object.fromEntries(PROMOTION_TYPES.map((t) => [t.value, t.label]));

interface PendingPromotionsQueueProps {
  initialPromotions: PendingPromotion[];
}

export function PendingPromotionsQueue({ initialPromotions }: PendingPromotionsQueueProps) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingApproveId, setConfirmingApproveId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detail, setDetail] = useState<FullPromotion | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function removePromotion(id: string) {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/promotions/${id}`);
      const data = await res.json();
      if (res.ok) setDetail(data.promotion);
      else setToast({ message: data.error ?? "Failed to load details.", tone: "error" });
    } catch {
      setToast({ message: "Failed to load details.", tone: "error" });
    } finally {
      setDetailLoading(false);
    }
  }

  async function confirmApprove(promotion: PendingPromotion) {
    setBusyId(promotion.id);
    try {
      const res = await fetch(`/api/admin/promotions/${promotion.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to approve promotion.", tone: "error" });
        return;
      }
      removePromotion(promotion.id);
      setToast({ message: `Approved "${promotion.title}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to approve promotion.", tone: "error" });
    } finally {
      setBusyId(null);
      setConfirmingApproveId(null);
    }
  }

  async function submitReject(promotion: PendingPromotion) {
    const reason = rejectReason.trim();
    if (!reason) {
      setToast({ message: "A rejection reason is required.", tone: "error" });
      return;
    }

    setBusyId(promotion.id);
    try {
      const res = await fetch(`/api/admin/promotions/${promotion.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to reject promotion.", tone: "error" });
        return;
      }
      removePromotion(promotion.id);
      setToast({ message: `Rejected "${promotion.title}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to reject promotion.", tone: "error" });
    } finally {
      setBusyId(null);
      setRejectingId(null);
      setRejectReason("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {promotions.length === 0 ? (
        <p className="text-sm text-stone">No pending promotions — all caught up.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {promotions.map((promotion) => (
            <li
              key={promotion.id}
              className="rounded-sm border border-sand bg-paper p-4 transition-colors hover:bg-sand/20"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-sand bg-sand">
                  <Megaphone className="h-5 w-5 text-stone" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-ink">{promotion.title}</p>
                  <p className="truncate text-sm text-stone">{promotion.business.businessName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="category">{TYPE_LABEL[promotion.type]}</Badge>
                    <span className="text-xs text-stone">Submitted {formatDate(promotion.createdAt)}</span>
                    <span className="text-xs text-stone">
                      {formatDate(promotion.startDate)} – {formatDate(promotion.endDate)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    title="View details"
                    aria-label="View details"
                    onClick={() => openDetail(promotion.id)}
                    className="rounded-sm p-2 text-stone transition-colors hover:bg-sand hover:text-ink"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  </button>

                  {confirmingApproveId === promotion.id ? (
                    <>
                      <span className="text-xs text-stone">Confirm approve?</span>
                      <button
                        type="button"
                        disabled={busyId === promotion.id}
                        onClick={() => confirmApprove(promotion)}
                        className="rounded-sm bg-approvedGreen px-3 py-1.5 text-xs font-medium text-paper hover:bg-approvedGreen/90 disabled:opacity-60"
                      >
                        Yes, approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingApproveId(null)}
                        className="rounded-sm border border-ink px-3 py-1.5 text-xs text-ink hover:bg-sand"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      title="Approve"
                      aria-label="Approve"
                      onClick={() => setConfirmingApproveId(promotion.id)}
                      className="rounded-sm p-2 text-approvedGreen transition-colors hover:bg-approvedGreen/10"
                    >
                      <Check className="h-4 w-4" strokeWidth={2} />
                    </button>
                  )}

                  {rejectingId !== promotion.id && (
                    <button
                      type="button"
                      title="Reject"
                      aria-label="Reject"
                      onClick={() => {
                        setRejectingId(promotion.id);
                        setRejectReason("");
                      }}
                      className="rounded-sm p-2 text-rejectedRed transition-colors hover:bg-rejectedRed/10"
                    >
                      <XIcon className="h-4 w-4" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              {rejectingId === promotion.id && (
                <div className="mt-3 flex flex-col gap-2 border-t border-sand pt-3">
                  <label htmlFor={`reject-reason-${promotion.id}`} className="text-xs font-medium text-ink">
                    Rejection reason (required)
                  </label>
                  <textarea
                    id={`reject-reason-${promotion.id}`}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={2}
                    className="w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange"
                    placeholder="Why is this promotion being rejected?"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === promotion.id}
                      onClick={() => submitReject(promotion)}
                      className="rounded-sm bg-rejectedRed px-3 py-1.5 text-xs font-medium text-paper hover:bg-rejectedRed/90 disabled:opacity-60"
                    >
                      Confirm reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="rounded-sm border border-ink px-3 py-1.5 text-xs text-ink hover:bg-sand"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={detailLoading || detail !== null} onClose={() => setDetail(null)} title="Promotion details">
        {detailLoading && !detail ? (
          <p className="text-sm text-stone">Loading...</p>
        ) : detail ? (
          <PromotionDetailView promotion={detail} />
        ) : null}
      </Modal>
    </div>
  );
}
