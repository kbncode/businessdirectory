"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Star, EyeOff, Trash2, Store } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { BusinessDetailView } from "@/components/admin/BusinessDetailView";
import { FeaturedToggle } from "@/components/admin/FeaturedToggle";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";
import { formatBusinessLocation, formatDate } from "@/lib/format";
import type { AdminListItem, getBusinessForAdmin } from "@/lib/queries/admin-business";

type ListedBusiness = AdminListItem;
type FullBusiness = NonNullable<Awaited<ReturnType<typeof getBusinessForAdmin>>>;

interface ListingsTableProps {
  initialBusinesses: ListedBusiness[];
  initialCursor: string | null;
  status?: string;
  q?: string;
}

function Thumbnail({ business }: { business: ListedBusiness }) {
  return (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-sand bg-sand">
      {business.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Blob/local-hosted thumbnail
        <img src={business.photoUrl} alt={business.businessName} className="h-full w-full object-cover" />
      ) : (
        <Store className="h-4 w-4 text-stone" strokeWidth={1.75} />
      )}
    </div>
  );
}

function IconButton({
  title,
  tone = "default",
  disabled,
  onClick,
  children,
}: {
  title: string;
  tone?: "default" | "destructive";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-sm p-2 transition-colors disabled:opacity-40",
        tone === "destructive" ? "text-rejectedRed hover:bg-rejectedRed/10" : "text-stone hover:bg-sand hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

export function ListingsTable({ initialBusinesses, initialCursor, status, q }: ListingsTableProps) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FullBusiness | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [featuring, setFeaturing] = useState<ListedBusiness | null>(null);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      params.set("cursor", cursor);
      const res = await fetch(`/api/admin/businesses?${params.toString()}`);
      const data: { items: ListedBusiness[]; nextCursor: string | null } = await res.json();
      setBusinesses((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
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

  async function unpublish(business: ListedBusiness) {
    if (!window.confirm(`Unpublish "${business.businessName}"? It will no longer be visible on the public site.`)) {
      return;
    }

    setBusyId(business.id);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/unpublish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to unpublish listing.", tone: "error" });
        return;
      }
      setBusinesses((prev) => prev.map((b) => (b.id === business.id ? { ...b, ...data.business } : b)));
      setToast({ message: `Unpublished "${business.businessName}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to unpublish listing.", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteListing(business: ListedBusiness) {
    if (
      !window.confirm(
        `Permanently delete "${business.businessName}"? This cannot be undone — the listing and its uploaded files will be removed.`
      )
    ) {
      return;
    }

    setBusyId(business.id);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to delete listing.", tone: "error" });
        return;
      }
      setBusinesses((prev) => prev.filter((b) => b.id !== business.id));
      setToast({ message: `Deleted "${business.businessName}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to delete listing.", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {businesses.length === 0 ? (
        <p className="text-sm text-stone">No listings match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-sand">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-stone">
                <th className="py-2 pl-4 pr-3">Photo</th>
                <th className="py-2 pr-3">Business</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">City</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Featured</th>
                <th className="py-2 pr-3">Submitted</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business) => (
                <tr key={business.id} className="border-t border-sand bg-paper transition-colors hover:bg-sand/40">
                  <td className="py-2 pl-4 pr-3">
                    <Thumbnail business={business} />
                  </td>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-ink">{business.businessName}</p>
                    <p className="text-xs text-stone">{business.ownerName}</p>
                  </td>
                  <td className="py-2 pr-3 text-stone">{business.mainCategory.name}</td>
                  <td className="py-2 pr-3 text-stone">{formatBusinessLocation(business)}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={business.status} />
                  </td>
                  <td className="py-2 pr-3">
                    {business.isFeatured ? (
                      <span className="inline-flex items-center rounded-sm bg-signalOrange px-2 py-0.5 text-xs font-medium text-ink">
                        Featured
                      </span>
                    ) : (
                      <span className="text-xs text-stone">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-stone">{formatDate(business.createdAt)}</td>
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-0.5">
                      <IconButton title="View details" onClick={() => openDetail(business.id)}>
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      </IconButton>
                      <Link
                        href={`/admin/listings/${business.id}/edit`}
                        title="Edit listing"
                        aria-label="Edit listing"
                        className="rounded-sm p-2 text-stone transition-colors hover:bg-sand hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                      <IconButton title={business.isFeatured ? "Edit feature" : "Feature"} onClick={() => setFeaturing(business)}>
                        <Star
                          className="h-4 w-4"
                          strokeWidth={1.75}
                          fill={business.isFeatured ? "currentColor" : "none"}
                        />
                      </IconButton>
                      {business.status === "APPROVED" && (
                        <IconButton
                          title="Unpublish"
                          disabled={busyId === business.id}
                          onClick={() => unpublish(business)}
                        >
                          <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                        </IconButton>
                      )}
                      <IconButton
                        title="Delete listing"
                        tone="destructive"
                        disabled={busyId === business.id}
                        onClick={() => deleteListing(business)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
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

      <Modal open={detailLoading || detail !== null} onClose={() => setDetail(null)} title="Listing details">
        {detailLoading && !detail ? (
          <p className="text-sm text-stone">Loading...</p>
        ) : detail ? (
          <BusinessDetailView business={detail} />
        ) : null}
      </Modal>

      <Modal open={featuring !== null} onClose={() => setFeaturing(null)} title="Featured listing">
        {featuring && (
          <FeaturedToggle
            businessId={featuring.id}
            businessName={featuring.businessName}
            status={featuring.status}
            initial={{
              isFeatured: featuring.isFeatured,
              featuredStartDate: featuring.featuredStartDate ? featuring.featuredStartDate.toString() : null,
              featuredEndDate: featuring.featuredEndDate ? featuring.featuredEndDate.toString() : null,
            }}
            onSaved={(updated) => {
              setBusinesses((prev) =>
                prev.map((b) =>
                  b.id === featuring.id
                    ? {
                        ...b,
                        isFeatured: updated.isFeatured,
                        featuredStartDate: updated.featuredStartDate ? new Date(updated.featuredStartDate) : null,
                        featuredEndDate: updated.featuredEndDate ? new Date(updated.featuredEndDate) : null,
                      }
                    : b
                )
              );
              setToast({
                message: updated.isFeatured
                  ? `"${featuring.businessName}" is now featured.`
                  : `"${featuring.businessName}" removed from featured.`,
                tone: "success",
              });
              setFeaturing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
