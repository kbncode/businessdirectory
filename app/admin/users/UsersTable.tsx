"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { buttonClasses } from "@/components/ui/Button";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { ViewerListingBadge } from "@/components/admin/ViewerListingBadge";
import { ViewerUserDetailView } from "@/components/admin/ViewerUserDetailView";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { getViewerListingStatus, type ViewerListItem, type getViewerUserForAdmin } from "@/lib/queries/viewer-users";

type FullViewerUser = NonNullable<Awaited<ReturnType<typeof getViewerUserForAdmin>>>;

interface UsersTableProps {
  initialUsers: ViewerListItem[];
  initialCursor: string | null;
}

export function UsersTable({ initialUsers, initialCursor }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FullViewerUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ cursor });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data: { items: ViewerListItem[]; nextCursor: string | null } = await res.json();
      setUsers((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      if (res.ok) setDetail(data.user);
      else setToast({ message: data.error ?? "Failed to load user.", tone: "error" });
    } catch {
      setToast({ message: "Failed to load user.", tone: "error" });
    } finally {
      setDetailLoading(false);
    }
  }

  async function deleteUser(user: ViewerListItem) {
    const listingWarning =
      user.businesses.length > 0
        ? ` This will also permanently delete their ${user.businesses.length} business listing${
            user.businesses.length === 1 ? "" : "s"
          }.`
        : "";
    if (!window.confirm(`Permanently delete "${user.email}"?${listingWarning} This cannot be undone.`)) {
      return;
    }

    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to delete user.", tone: "error" });
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setToast({ message: `Deleted "${user.email}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to delete user.", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {users.length === 0 ? (
        <p className="text-sm text-stone">No signed-up users yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-sand">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-stone">
                <th className="py-2 pl-4 pr-3">Email</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Listing</th>
                <th className="py-2 pr-3">Signed up</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-sand bg-paper transition-colors hover:bg-sand/40">
                  <td className="py-2 pl-4 pr-3 text-ink">{user.email}</td>
                  <td className="py-2 pr-3 text-stone">{user.name ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <ViewerListingBadge status={getViewerListingStatus(user.businesses)} />
                  </td>
                  <td className="py-2 pr-3 text-stone">{formatDate(user.createdAt)}</td>
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-0.5">
                      <button
                        type="button"
                        title="View user"
                        aria-label="View user"
                        onClick={() => openDetail(user.id)}
                        className="rounded-sm p-2 text-stone transition-colors hover:bg-sand hover:text-ink"
                      >
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        title="Delete user"
                        aria-label="Delete user"
                        disabled={busyId === user.id}
                        onClick={() => deleteUser(user)}
                        className="rounded-sm p-2 text-rejectedRed transition-colors hover:bg-rejectedRed/10 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
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

      <Modal open={detailLoading || detail !== null} onClose={() => setDetail(null)} title="User details">
        {detailLoading && !detail ? (
          <p className="text-sm text-stone">Loading...</p>
        ) : detail ? (
          <ViewerUserDetailView user={detail} />
        ) : null}
      </Modal>
    </div>
  );
}
