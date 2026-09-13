"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { buttonClasses } from "@/components/ui/Button";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import type { MasterDataTableSlug } from "@/lib/master-data-registry";

export interface MasterDataItem {
  id: string;
  name: string;
  parentId?: string;
}

export interface MasterDataParentOption {
  id: string;
  name: string;
}

interface MasterDataManagerProps {
  tableSlug: MasterDataTableSlug;
  entityLabel: string;
  items: MasterDataItem[];
  parentOptions?: MasterDataParentOption[];
  parentLabel?: string;
  searchable?: boolean;
  paginated?: boolean;
}

const PAGE_SIZE = 20;

const inputClass =
  "rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange";

export function MasterDataManager({
  tableSlug,
  entityLabel,
  items: initialItems,
  parentOptions,
  parentLabel,
  searchable = false,
  paginated = false,
}: MasterDataManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [filterParentId, setFilterParentId] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [toast, setToast] = useState<AdminToastValue | null>(null);

  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of parentOptions ?? []) map.set(p.id, p.name);
    return map;
  }, [parentOptions]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterParentId && item.parentId !== filterParentId) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, filterParentId, search]);

  const pageCount = paginated ? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)) : 1;
  const currentPage = Math.min(page, pageCount);
  const visible = paginated ? filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : filtered;

  function openAddForm() {
    setEditingItem(null);
    setFormName("");
    setFormParentId("");
    setFormOpen(true);
  }

  function openEditForm(item: MasterDataItem) {
    setEditingItem(item);
    setFormName(item.name);
    setFormParentId(item.parentId ?? "");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingItem(null);
  }

  async function handleSave() {
    const name = formName.trim();
    if (!name) {
      setToast({ message: `Enter a ${entityLabel.toLowerCase()} name.`, tone: "error" });
      return;
    }
    if (parentOptions && !formParentId) {
      setToast({ message: `Select a ${parentLabel?.toLowerCase() ?? "parent"}.`, tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const url = editingItem
        ? `/api/admin/master-data/${tableSlug}/${editingItem.id}`
        : `/api/admin/master-data/${tableSlug}`;
      const res = await fetch(url, {
        method: editingItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: formParentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to save changes.", tone: "error" });
        return;
      }

      if (editingItem) {
        setItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { id: i.id, name, parentId: parentOptions ? formParentId : undefined } : i))
        );
        setToast({ message: `Saved "${name}".`, tone: "success" });
      } else {
        const newItem: MasterDataItem = {
          id: data.item.id,
          name: data.item.name,
          parentId: parentOptions ? formParentId : undefined,
        };
        setItems((prev) => [...prev, newItem]);
        setToast({ message: `Added "${name}".`, tone: "success" });
      }
      closeForm();
    } catch {
      setToast({ message: "Failed to save changes.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: MasterDataItem) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/master-data/${tableSlug}/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Unable to delete this row.", tone: "error" });
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setToast({ message: `Deleted "${item.name}".`, tone: "success" });
    } catch {
      setToast({ message: "Unable to delete this row.", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="flex flex-wrap items-center gap-3">
        {searchable && (
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={`Search ${entityLabel.toLowerCase()}s`}
            className={cn(inputClass, "w-64")}
          />
        )}
        {parentOptions && (
          <select
            value={filterParentId}
            onChange={(e) => {
              setFilterParentId(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All {parentLabel?.toLowerCase()}s</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-stone">{filtered.length} total</span>

        <button
          type="button"
          onClick={openAddForm}
          className={cn(buttonClasses("primary"), "ml-auto items-center gap-1.5")}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add {entityLabel.toLowerCase()}
        </button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-sand">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-sand text-xs uppercase tracking-wide text-stone">
              <th className="py-2 pl-4 pr-3">Name</th>
              {parentOptions && <th className="py-2 pr-3">{parentLabel}</th>}
              <th className="py-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={parentOptions ? 3 : 2} className="py-4 pl-4 text-sm text-stone">
                  No {entityLabel.toLowerCase()}s found.
                </td>
              </tr>
            ) : (
              visible.map((item) => (
                <tr key={item.id} className="border-t border-sand bg-paper transition-colors hover:bg-sand/40">
                  <td className="py-2 pl-4 pr-3 text-ink">{item.name}</td>
                  {parentOptions && (
                    <td className="py-2 pr-3 text-stone">
                      {item.parentId ? parentNameById.get(item.parentId) ?? "—" : "—"}
                    </td>
                  )}
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        title={`Edit ${item.name}`}
                        aria-label={`Edit ${item.name}`}
                        onClick={() => openEditForm(item)}
                        className="rounded-sm p-1.5 text-stone transition-colors hover:bg-sand hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        title={`Delete ${item.name}`}
                        aria-label={`Delete ${item.name}`}
                        disabled={busyId === item.id}
                        onClick={() => handleDelete(item)}
                        className="rounded-sm p-1.5 text-rejectedRed transition-colors hover:bg-rejectedRed/10 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginated && pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-sm border border-ink px-3 py-1.5 text-ink disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-stone">
            Page {currentPage} of {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="rounded-sm border border-ink px-3 py-1.5 text-ink disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <Modal open={formOpen} onClose={closeForm} title={editingItem ? `Edit ${entityLabel.toLowerCase()}` : `Add ${entityLabel.toLowerCase()}`}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-stone" htmlFor="master-data-name">
              {entityLabel} name
            </label>
            <input
              id="master-data-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={`${entityLabel} name`}
              className={cn(inputClass, "mt-1 w-full")}
            />
          </div>

          {parentOptions && (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-stone" htmlFor="master-data-parent">
                {parentLabel}
              </label>
              <select
                id="master-data-parent"
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                className={cn(inputClass, "mt-1 w-full")}
              >
                <option value="">Select {parentLabel?.toLowerCase()}</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className={cn(buttonClasses("primary"), "disabled:opacity-60")}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={closeForm} className={buttonClasses("ghost")}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
