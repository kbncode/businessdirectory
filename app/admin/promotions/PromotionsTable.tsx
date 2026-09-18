"use client";

import { useState, Fragment } from "react";
import { Eye, Ban, Check, X as XIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PromotionDetailView } from "@/components/admin/PromotionDetailView";
import { PromotionStatusBadge } from "@/components/promotions/PromotionStatusBadge";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { PROMOTION_TYPES } from "@/lib/promotion-validation";
import { getPromotionDisplayStatus } from "@/lib/promotion-status";
import { formatDate } from "@/lib/format";
import type { AdminPromotionListItem } from "@/lib/queries/admin-promotions";
import type { getPromotionForAdmin } from "@/lib/queries/admin-promotions";

type FullPromotion = NonNullable<Awaited<ReturnType<typeof getPromotionForAdmin>>>;

const TYPE_LABEL: Record<string, string> = Object.fromEntries(PROMOTION_TYPES.map((t) => [t.value, t.label]));

interface PromotionsTableProps {
  initialPromotions: AdminPromotionListItem[];
  initialCursor: string | null;
  status?: string;
  q?: string;
}

function SortOrderInput({ promotion, onSaved }: { promotion: AdminPromotionListItem; onSaved: (sortOrder: number | null) => void }) {
  const [value, setValue] = useState(promotion.sortOrder === null ? "" : String(promotion.sortOrder));
  const [saving, setSaving] = useState(false);

  async function save() {
    const nextValue = value.trim() === "" ? null : Number(value);
    if (nextValue !== null && !Number.isInteger(nextValue)) return;
    if (nextValue === promotion.sortOrder) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: nextValue }),
      });
      if (res.ok) onSaved(nextValue);
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      type="number"
      value={value}
      disabled={saving}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      placeholder="—"
      className="w-16 rounded-sm border border-sand bg-paper px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange"
    />
  );
}

export function PromotionsTable({ initialPromotions, initialCursor, status, q }: PromotionsTableProps) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FullPromotion | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const [confirmingApproveId, setConfirmingApproveId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      params.set("cursor", cursor);
      const res = await fetch(`/api/admin/promotions?${params.toString()}`);
      const data: { items: AdminPromotionListItem[]; nextCursor: string | null } = await res.json();
      setPromotions((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
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

  async function confirmRemove(promotion: AdminPromotionListItem) {
    setBusyId(promotion.id);
    try {
      const res = await fetch(`/api/admin/promotions/${promotion.id}/remove`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to remove promotion.", tone: "error" });
        return;
      }
      setPromotions((prev) =>
        prev.map((p) => (p.id === promotion.id ? { ...p, status: "REMOVED", removedAt: new Date() } : p))
      );
      setToast({ message: `Removed "${promotion.title}" from the home page.`, tone: "success" });
    } catch {
      setToast({ message: "Failed to remove promotion.", tone: "error" });
    } finally {
      setBusyId(null);
      setConfirmingRemoveId(null);
    }
  }

  async function confirmApprove(promotion: AdminPromotionListItem) {
    setBusyId(promotion.id);
    try {
      const res = await fetch(`/api/admin/promotions/${promotion.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to approve promotion.", tone: "error" });
        return;
      }
      setPromotions((prev) =>
        prev.map((p) => (p.id === promotion.id ? { ...p, status: "APPROVED" } : p))
      );
      setToast({ message: `Approved "${promotion.title}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to approve promotion.", tone: "error" });
    } finally {
      setBusyId(null);
      setConfirmingApproveId(null);
    }
  }

  async function submitReject(promotion: AdminPromotionListItem) {
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
      setPromotions((prev) => (prev.map((p) => (p.id === promotion.id ? { ...p, status: "REJECTED" } : p))));
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
        <p className="text-sm text-stone">No promotions match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-sand">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-stone">
                <th className="py-2 pl-4 pr-3">Title</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Business</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Dates</th>
                <th className="py-2 pr-3">Sort</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => {
                const displayStatus = getPromotionDisplayStatus(promotion);
                const canRemove = displayStatus === "APPROVED";
                const canModerate = displayStatus === "PENDING";

                return (
                  <Fragment key={promotion.id}>
                    <tr className="border-t border-sand bg-paper transition-colors hover:bg-sand/40">
                      <td className="py-2 pl-4 pr-3 text-ink">{promotion.title}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="category">{TYPE_LABEL[promotion.type]}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-stone">{promotion.business.businessName}</td>
                      <td className="py-2 pr-3">
                        <PromotionStatusBadge status={promotion.status} endDate={promotion.endDate} />
                      </td>
                      <td className="py-2 pr-3 text-stone">
                        {formatDate(promotion.startDate)} – {formatDate(promotion.endDate)}
                      </td>
                      <td className="py-2 pr-3">
                        <SortOrderInput
                          promotion={promotion}
                          onSaved={(sortOrder) =>
                            setPromotions((prev) => prev.map((p) => (p.id === promotion.id ? { ...p, sortOrder } : p)))
                          }
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex justify-end gap-0.5">
                          <button
                            type="button"
                            title="View details"
                            aria-label="View details"
                            onClick={() => openDetail(promotion.id)}
                            className="rounded-sm p-2 text-stone transition-colors hover:bg-sand hover:text-ink"
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </button>

                          {canModerate && (
                            <>
                              {confirmingApproveId === promotion.id ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="text-xs text-stone">Approve?</span>
                                  <button
                                    type="button"
                                    disabled={busyId === promotion.id}
                                    onClick={() => confirmApprove(promotion)}
                                    className="rounded-sm bg-approvedGreen px-2 py-1 text-xs font-medium text-paper hover:bg-approvedGreen/90 disabled:opacity-60"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingApproveId(null)}
                                    className="rounded-sm border border-ink px-2 py-1 text-xs text-ink hover:bg-sand"
                                  >
                                    No
                                  </button>
                                </span>
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
                            </>
                          )}

                          {canRemove &&
                            (confirmingRemoveId === promotion.id ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-xs text-stone">Remove?</span>
                                <button
                                  type="button"
                                  disabled={busyId === promotion.id}
                                  onClick={() => confirmRemove(promotion)}
                                  className="rounded-sm bg-rejectedRed px-2 py-1 text-xs font-medium text-paper hover:bg-rejectedRed/90 disabled:opacity-60"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingRemoveId(null)}
                                  className="rounded-sm border border-ink px-2 py-1 text-xs text-ink hover:bg-sand"
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                title="Remove from home page"
                                aria-label="Remove from home page"
                                onClick={() => setConfirmingRemoveId(promotion.id)}
                                className="rounded-sm p-2 text-rejectedRed transition-colors hover:bg-rejectedRed/10"
                              >
                                <Ban className="h-4 w-4" strokeWidth={1.75} />
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>

                    {rejectingId === promotion.id && (
                      <tr className="border-t border-sand bg-sand/10">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex flex-col gap-2">
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
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {cursor && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className={cn(buttonClasses("secondary"), "disabled:opacity-60")}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
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
