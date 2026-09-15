"use client";

import { useMemo, useState } from "react";
import type { HeaderMenuItem } from "@prisma/client";
import { GripVertical, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { FormField, fieldInputClass } from "@/components/ui/FormField";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";
import {
  SYSTEM_ROUTES,
  validateHeaderMenuItemForm,
  resolveHeaderMenuHref,
  type HeaderMenuItemFormValues,
  type HeaderMenuItemFormErrors,
  type HeaderMenuLinkType,
} from "@/lib/header-menu-validation";

const EMPTY_VALUES: HeaderMenuItemFormValues = {
  label: "",
  linkType: "SYSTEM",
  pageSlug: "",
  systemRoute: "",
  externalUrl: "",
  openInNewTab: false,
  isCta: false,
};

function toFormValues(item: HeaderMenuItem): HeaderMenuItemFormValues {
  return {
    label: item.label,
    linkType: item.linkType,
    pageSlug: item.pageSlug ?? "",
    systemRoute: item.systemRoute ?? "",
    externalUrl: item.externalUrl ?? "",
    openInNewTab: item.openInNewTab,
    isCta: item.isCta,
  };
}

function linkTargetLabel(item: HeaderMenuItem, pages: { slug: string; title: string }[]) {
  if (item.linkType === "PAGE") {
    return pages.find((p) => p.slug === item.pageSlug)?.title ?? item.pageSlug ?? "(page)";
  }
  if (item.linkType === "SYSTEM") {
    return SYSTEM_ROUTES.find((r) => r.value === item.systemRoute)?.label ?? item.systemRoute ?? "(route)";
  }
  return item.externalUrl ?? "(URL)";
}

interface HeaderMenuManagerProps {
  initialItems: HeaderMenuItem[];
  publishedPages: { slug: string; title: string }[];
}

export function HeaderMenuManager({ initialItems, publishedPages }: HeaderMenuManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<HeaderMenuItemFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<HeaderMenuItemFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function setField<K extends keyof HeaderMenuItemFormValues>(name: K, value: HeaderMenuItemFormValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function openAddForm() {
    setEditingId(null);
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormOpen(true);
  }

  function openEditForm(item: HeaderMenuItem) {
    setEditingId(item.id);
    setValues(toFormValues(item));
    setErrors({});
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const fieldErrors = validateHeaderMenuItemForm(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = editingId ? `/api/admin/header-menu/${editingId}` : "/api/admin/header-menu";
      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setToast({ message: data.error ?? "Failed to save menu item.", tone: "error" });
        return;
      }

      if (editingId) {
        setItems((prev) => prev.map((item) => (item.id === editingId ? data.item : item)));
      } else {
        setItems((prev) => [...prev, data.item]);
      }
      setToast({ message: editingId ? "Menu item updated." : "Menu item added.", tone: "success" });
      closeForm();
    } catch {
      setToast({ message: "Failed to save menu item.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item: HeaderMenuItem) {
    const nextActive = !item.isActive;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive: nextActive } : i)));

    const res = await fetch(`/api/admin/header-menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextActive }),
    });
    if (!res.ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive: item.isActive } : i)));
      setToast({ message: "Failed to update menu item.", tone: "error" });
    }
  }

  async function deleteItem(item: HeaderMenuItem) {
    if (!window.confirm(`Delete "${item.label}" from the header menu?`)) return;

    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    const res = await fetch(`/api/admin/header-menu/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(previous);
      setToast({ message: "Failed to delete menu item.", tone: "error" });
    }
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setItems((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((i) => i.id === draggedId);
      const toIndex = next.findIndex((i) => i.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      fetch("/api/admin/header-menu/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
      }).catch(() => setToast({ message: "Failed to save new order.", tone: "error" }));

      return next;
    });

    setDraggedId(null);
  }

  // Reflects unsaved form edits too (not just the saved list) so the
  // preview genuinely updates as the admin types, not only after a save.
  const previewItems = useMemo(() => {
    if (!formOpen || !values.label.trim()) return items.filter((i) => i.isActive);

    const draft = {
      id: editingId ?? "__draft__",
      label: values.label,
      linkType: values.linkType,
      pageSlug: values.pageSlug || null,
      systemRoute: values.systemRoute || null,
      externalUrl: values.externalUrl || null,
      openInNewTab: values.openInNewTab,
      isCta: values.isCta,
      isActive: true,
      sortOrder: 0,
    };

    if (editingId) {
      return items.filter((i) => i.isActive || i.id === editingId).map((i) => (i.id === editingId ? draft : i));
    }
    return [...items.filter((i) => i.isActive), draft];
  }, [formOpen, values, items, editingId]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">
            Menu items ({items.length})
          </h2>
          {!formOpen && (
            <button type="button" onClick={openAddForm} className={buttonClasses("primary")}>
              Add menu item
            </button>
          )}
        </div>

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-sm border border-sand bg-paper p-5"
          >
            <h3 className="font-display text-sm font-bold text-ink">
              {editingId ? "Edit menu item" : "New menu item"}
            </h3>

            <FormField label="Label" htmlFor="hm-label" required error={errors.label}>
              <input
                id="hm-label"
                className={fieldInputClass}
                value={values.label}
                onChange={(event) => setField("label", event.target.value)}
              />
            </FormField>

            <FormField label="Link type" htmlFor="hm-linkType">
              <div className="flex gap-2">
                {(["SYSTEM", "PAGE", "EXTERNAL"] as HeaderMenuLinkType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("linkType", type)}
                    className={cn(
                      "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                      values.linkType === type ? "bg-signalOrange text-ink" : "bg-sand text-stone hover:text-ink"
                    )}
                  >
                    {type === "SYSTEM" ? "System route" : type === "PAGE" ? "Page" : "External URL"}
                  </button>
                ))}
              </div>
            </FormField>

            {values.linkType === "SYSTEM" && (
              <FormField label="Route" htmlFor="hm-systemRoute" required error={errors.systemRoute}>
                <select
                  id="hm-systemRoute"
                  className={fieldInputClass}
                  value={values.systemRoute}
                  onChange={(event) => setField("systemRoute", event.target.value)}
                >
                  <option value="">Select a route</option>
                  {SYSTEM_ROUTES.map((route) => (
                    <option key={route.value} value={route.value}>
                      {route.label} ({route.value})
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {values.linkType === "PAGE" && (
              <FormField label="Page" htmlFor="hm-pageSlug" required error={errors.pageSlug}>
                {publishedPages.length === 0 ? (
                  <p className="text-sm text-stone">No published pages yet.</p>
                ) : (
                  <select
                    id="hm-pageSlug"
                    className={fieldInputClass}
                    value={values.pageSlug}
                    onChange={(event) => setField("pageSlug", event.target.value)}
                  >
                    <option value="">Select a page</option>
                    {publishedPages.map((page) => (
                      <option key={page.slug} value={page.slug}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
            )}

            {values.linkType === "EXTERNAL" && (
              <>
                <FormField
                  label="External URL"
                  htmlFor="hm-externalUrl"
                  required
                  error={errors.externalUrl}
                  hint="Include https://"
                >
                  <input
                    id="hm-externalUrl"
                    type="url"
                    placeholder="https://example.com"
                    className={fieldInputClass}
                    value={values.externalUrl}
                    onChange={(event) => setField("externalUrl", event.target.value)}
                  />
                </FormField>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={values.openInNewTab}
                    onChange={(event) => setField("openInNewTab", event.target.checked)}
                    className="h-4 w-4 rounded-sm border-ink text-signalOrange focus:ring-signalOrange"
                  />
                  Open in new tab
                </label>
              </>
            )}

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={values.isCta}
                onChange={(event) => setField("isCta", event.target.checked)}
                className="h-4 w-4 rounded-sm border-ink text-signalOrange focus:ring-signalOrange"
              />
              Style as CTA button
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className={cn(buttonClasses("primary"), "disabled:opacity-60")}>
                {submitting ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={closeForm} className={buttonClasses("secondary")}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-stone">No menu items yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(item.id)}
                className="flex cursor-move items-center gap-3 rounded-sm border border-sand bg-paper p-3 transition-colors hover:bg-sand/20"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.75} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{item.label}</p>
                    {item.isCta && <Badge variant="category">CTA</Badge>}
                    {item.linkType === "EXTERNAL" && item.openInNewTab && (
                      <ExternalLink className="h-3.5 w-3.5 text-stone" strokeWidth={1.75} />
                    )}
                  </div>
                  <p className="truncate text-xs text-stone">
                    {item.linkType === "PAGE" ? "Page" : item.linkType === "SYSTEM" ? "Route" : "External"} &middot;{" "}
                    {linkTargetLabel(item, publishedPages)}
                  </p>
                </div>
                <Badge variant={item.isActive ? "approved" : "pending"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                <button
                  type="button"
                  onClick={() => toggleActive(item)}
                  className="shrink-0 rounded-sm border border-ink px-2 py-1 text-xs text-ink hover:bg-sand"
                >
                  {item.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  title="Edit menu item"
                  aria-label="Edit menu item"
                  onClick={() => openEditForm(item)}
                  className="shrink-0 rounded-sm p-1.5 text-stone transition-colors hover:bg-sand hover:text-ink"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  title="Delete menu item"
                  aria-label="Delete menu item"
                  onClick={() => deleteItem(item)}
                  className="shrink-0 rounded-sm p-1.5 text-rejectedRed transition-colors hover:bg-rejectedRed/10"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-full shrink-0 lg:w-80">
        <div className="sticky top-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Live preview</h2>
          <div className="mt-3 overflow-hidden rounded-sm border border-sand bg-paper">
            <div className="flex flex-wrap items-center gap-2 border-b border-sand p-3">
              <div className="h-6 w-16 shrink-0 rounded-sm bg-sand" aria-hidden />
              <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                {previewItems.map((item) => {
                  const href = resolveHeaderMenuHref(item);
                  return item.isCta ? (
                    <span key={item.id} className={cn(buttonClasses("primary"), "pointer-events-none text-xs")}>
                      {item.label || "Untitled"}
                    </span>
                  ) : (
                    <span
                      key={item.id}
                      title={href}
                      className="pointer-events-none rounded-sm px-2 py-1 text-xs text-ink"
                    >
                      {item.label || "Untitled"}
                    </span>
                  );
                })}
                <span className="pointer-events-none rounded-sm border border-ink px-2 py-1 text-xs text-ink">
                  Log in
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-stone">
            Search, and Log in / Sign up (or the account menu) are always shown around these items — only the
            content links/CTAs are admin-managed.
          </p>
        </div>
      </div>
    </div>
  );
}
