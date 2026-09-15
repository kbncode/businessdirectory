"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { formatDate } from "@/lib/format";
import type { getPagesForAdmin } from "@/lib/queries/admin-pages";

type PageRow = Awaited<ReturnType<typeof getPagesForAdmin>>[number];

export function PagesTable({ pages: initialPages }: { pages: PageRow[] }) {
  const [pages, setPages] = useState(initialPages);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<AdminToastValue | null>(null);

  async function deletePage(page: PageRow) {
    if (!window.confirm(`Permanently delete "${page.title}"? This cannot be undone.`)) {
      return;
    }

    setBusyId(page.id);
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to delete page.", tone: "error" });
        return;
      }
      setPages((prev) => prev.filter((p) => p.id !== page.id));
      setToast({ message: `Deleted "${page.title}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to delete page.", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {pages.length === 0 ? (
        <p className="text-sm text-stone">No pages yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-sand">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-stone">
                <th className="py-2 pl-4 pr-3">Title</th>
                <th className="py-2 pr-3">Slug</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Last updated</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-t border-sand bg-paper transition-colors hover:bg-sand/40">
                  <td className="py-2 pl-4 pr-3 text-ink">{page.title}</td>
                  <td className="py-2 pr-3 text-stone">/{page.slug}</td>
                  <td className="py-2 pr-3">
                    <Badge variant="category">{page.type === "ABOUT" ? "About" : "Custom"}</Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={page.status === "PUBLISHED" ? "approved" : "pending"}>
                      {page.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 text-stone">{formatDate(page.updatedAt)}</td>
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-0.5">
                      <Link
                        href={`/admin/pages/${page.id}/edit`}
                        title="Edit page"
                        aria-label="Edit page"
                        className="rounded-sm p-2 text-stone transition-colors hover:bg-sand hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                      {page.type === "ABOUT" ? (
                        <span
                          title="The About page is a system page and can't be deleted"
                          className="rounded-sm p-2 text-stone/40"
                        >
                          <Lock className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                      ) : (
                        <button
                          type="button"
                          title="Delete page"
                          aria-label="Delete page"
                          disabled={busyId === page.id}
                          onClick={() => deletePage(page)}
                          className="rounded-sm p-2 text-rejectedRed transition-colors hover:bg-rejectedRed/10 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
