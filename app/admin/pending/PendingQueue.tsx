"use client";

import { useState } from "react";
import { Eye, Check, X as XIcon, Store } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { BusinessDetailView } from "@/components/admin/BusinessDetailView";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { formatBusinessLocation, formatDate } from "@/lib/format";
import type { getPendingBusinesses, getBusinessForAdmin } from "@/lib/queries/admin-business";

type PendingBusiness = Awaited<ReturnType<typeof getPendingBusinesses>>[number];
type FullBusiness = NonNullable<Awaited<ReturnType<typeof getBusinessForAdmin>>>;

interface PendingQueueProps {
  initialBusinesses: PendingBusiness[];
}

function Thumbnail({ business }: { business: PendingBusiness }) {
  return (
    <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-sand bg-sand">
      {business.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Blob/local-hosted thumbnail
        <img src={business.photoUrl} alt={business.businessName} className="h-full w-full object-cover" />
      ) : (
        <Store className="h-5 w-5 text-stone" strokeWidth={1.75} />
      )}
    </div>
  );
}

export function PendingQueue({ initialBusinesses }: PendingQueueProps) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingApproveId, setConfirmingApproveId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detail, setDetail] = useState<FullBusiness | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function removeBusiness(id: string) {
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`);
      const data = await res.json();
      if (res.ok) setDetail(data.business);
      else setToast({ message: data.error ?? "Failed to load details.", tone: "error" });
    } catch {
      setToast({ message: "Failed to load details.", tone: "error" });
    } finally {
      setDetailLoading(false);
    }
  }

  async function confirmApprove(business: PendingBusiness) {
    setBusyId(business.id);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to approve listing.", tone: "error" });
        return;
      }
      removeBusiness(business.id);
      setToast({ message: `Approved "${business.businessName}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to approve listing.", tone: "error" });
    } finally {
      setBusyId(null);
      setConfirmingApproveId(null);
    }
  }

  async function submitReject(business: PendingBusiness) {
    const reason = rejectReason.trim();
    if (!reason) {
      setToast({ message: "A rejection reason is required.", tone: "error" });
      return;
    }

    setBusyId(business.id);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to reject listing.", tone: "error" });
        return;
      }
      removeBusiness(business.id);
      setToast({ message: `Rejected "${business.businessName}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to reject listing.", tone: "error" });
    } finally {
      setBusyId(null);
      setRejectingId(null);
      setRejectReason("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {businesses.length === 0 ? (
        <p className="text-sm text-stone">No pending listings — all caught up.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {businesses.map((business) => (
            <li key={business.id} className="rounded-sm border border-sand bg-paper p-4 transition-colors hover:bg-sand/20">
              <div className="flex flex-wrap items-center gap-4">
                <Thumbnail business={business} />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-ink">{business.businessName}</p>
                  <p className="truncate text-sm text-stone">
                    {business.ownerName} &middot; {formatBusinessLocation(business)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="category">{business.mainCategory.name}</Badge>
                    <span className="text-xs text-stone">
                      Submitted {formatDate(business.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    title="View details"
                    aria-label="View details"
                    onClick={() => openDetail(business.id)}
                    className="rounded-sm p-2 text-stone transition-colors hover:bg-sand hover:text-ink"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  </button>

                  {confirmingApproveId === business.id ? (
                    <>
                      <span className="text-xs text-stone">Confirm approve?</span>
                      <button
                        type="button"
                        disabled={busyId === business.id}
                        onClick={() => confirmApprove(business)}
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
                      onClick={() => setConfirmingApproveId(business.id)}
                      className="rounded-sm p-2 text-approvedGreen transition-colors hover:bg-approvedGreen/10"
                    >
                      <Check className="h-4 w-4" strokeWidth={2} />
                    </button>
                  )}

                  {rejectingId !== business.id && (
                    <button
                      type="button"
                      title="Reject"
                      aria-label="Reject"
                      onClick={() => {
                        setRejectingId(business.id);
                        setRejectReason("");
                      }}
                      className="rounded-sm p-2 text-rejectedRed transition-colors hover:bg-rejectedRed/10"
                    >
                      <XIcon className="h-4 w-4" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              {rejectingId === business.id && (
                <div className="mt-3 flex flex-col gap-2 border-t border-sand pt-3">
                  <label htmlFor={`reject-reason-${business.id}`} className="text-xs font-medium text-ink">
                    Rejection reason (required)
                  </label>
                  <textarea
                    id={`reject-reason-${business.id}`}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={2}
                    className="w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange"
                    placeholder="Why is this listing being rejected?"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === business.id}
                      onClick={() => submitReject(business)}
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

      <Modal open={detailLoading || detail !== null} onClose={() => setDetail(null)} title="Listing details">
        {detailLoading && !detail ? (
          <p className="text-sm text-stone">Loading...</p>
        ) : detail ? (
          <BusinessDetailView business={detail} />
        ) : null}
      </Modal>
    </div>
  );
}
