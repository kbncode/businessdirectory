"use client";

import { useMemo, useState } from "react";
import type { FooterLink } from "@prisma/client";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { FormField, fieldInputClass } from "@/components/ui/FormField";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";
import { resolveFooterIcon } from "@/components/icons/resolveFooterIcon";
import {
  FOOTER_ICON_OPTIONS,
  validateFooterLinkForm,
  type FooterLinkFormValues,
  type FooterLinkFormErrors,
} from "@/lib/footer-link-validation";

const EMPTY_VALUES: FooterLinkFormValues = { section: "", label: "", url: "", icon: "" };

function toFormValues(link: FooterLink): FooterLinkFormValues {
  return { section: link.section, label: link.label, url: link.url, icon: link.icon ?? "" };
}

function IconPreview({ icon }: { icon: string | null }) {
  const Icon = resolveFooterIcon(icon);
  if (!Icon) return null;
  return <Icon className="h-3.5 w-3.5 shrink-0 text-stone" />;
}

interface FooterLinksManagerProps {
  initialLinks: FooterLink[];
}

export function FooterLinksManager({ initialLinks }: FooterLinksManagerProps) {
  const [links, setLinks] = useState(initialLinks);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<FooterLinkFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FooterLinkFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sections = useMemo(() => {
    const bySection = new Map<string, FooterLink[]>();
    for (const link of links) {
      const group = bySection.get(link.section);
      if (group) group.push(link);
      else bySection.set(link.section, [link]);
    }
    Array.from(bySection.values()).forEach((group) => group.sort((a, b) => a.sortOrder - b.sortOrder));
    return Array.from(bySection.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [links]);

  const existingSections = useMemo(() => Array.from(new Set(links.map((l) => l.section))).sort(), [links]);

  function setField<K extends keyof FooterLinkFormValues>(name: K, value: FooterLinkFormValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function openAddForm(section?: string) {
    setEditingId(null);
    setValues({ ...EMPTY_VALUES, section: section ?? "" });
    setErrors({});
    setFormOpen(true);
  }

  function openEditForm(link: FooterLink) {
    setEditingId(link.id);
    setValues(toFormValues(link));
    setErrors({});
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const fieldErrors = validateFooterLinkForm(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = editingId ? `/api/admin/footer-links/${editingId}` : "/api/admin/footer-links";
      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setToast({ message: data.error ?? "Failed to save footer link.", tone: "error" });
        return;
      }

      if (editingId) {
        setLinks((prev) => prev.map((link) => (link.id === editingId ? data.link : link)));
      } else {
        setLinks((prev) => [...prev, data.link]);
      }
      setToast({ message: editingId ? "Footer link updated." : "Footer link added.", tone: "success" });
      closeForm();
    } catch {
      setToast({ message: "Failed to save footer link.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(link: FooterLink) {
    const nextActive = !link.isActive;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isActive: nextActive } : l)));

    const res = await fetch(`/api/admin/footer-links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextActive }),
    });
    if (!res.ok) {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isActive: link.isActive } : l)));
      setToast({ message: "Failed to update footer link.", tone: "error" });
    }
  }

  async function deleteLink(link: FooterLink) {
    if (!window.confirm(`Delete "${link.label}" from the footer?`)) return;

    const previous = links;
    setLinks((prev) => prev.filter((l) => l.id !== link.id));

    const res = await fetch(`/api/admin/footer-links/${link.id}`, { method: "DELETE" });
    if (!res.ok) {
      setLinks(previous);
      setToast({ message: "Failed to delete footer link.", tone: "error" });
    }
  }

  function handleDrop(section: string, targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setLinks((prev) => {
      const sectionIds = prev.filter((l) => l.section === section).map((l) => l.id);
      if (!sectionIds.includes(draggedId)) return prev;

      const fromIndex = sectionIds.indexOf(draggedId);
      const toIndex = sectionIds.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const reorderedIds = [...sectionIds];
      const [moved] = reorderedIds.splice(fromIndex, 1);
      reorderedIds.splice(toIndex, 0, moved);

      const sortOrderById = new Map(reorderedIds.map((id, index) => [id, index]));
      const next = prev.map((l) => (sortOrderById.has(l.id) ? { ...l, sortOrder: sortOrderById.get(l.id)! } : l));

      fetch("/api/admin/footer-links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reorderedIds }),
      }).catch(() => setToast({ message: "Failed to save new order.", tone: "error" }));

      return next;
    });

    setDraggedId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">
          Footer links ({links.length})
        </h2>
        {!formOpen && (
          <button type="button" onClick={() => openAddForm()} className={buttonClasses("primary")}>
            Add footer link
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-sm border border-sand bg-paper p-5">
          <h3 className="font-display text-sm font-bold text-ink">
            {editingId ? "Edit footer link" : "New footer link"}
          </h3>

          <FormField
            label="Section"
            htmlFor="fl-section"
            required
            error={errors.section}
            hint="Type an existing section name or a new one."
          >
            <input
              id="fl-section"
              list="footer-sections"
              className={fieldInputClass}
              value={values.section}
              onChange={(event) => setField("section", event.target.value)}
            />
            <datalist id="footer-sections">
              {existingSections.map((section) => (
                <option key={section} value={section} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Label" htmlFor="fl-label" required error={errors.label}>
            <input
              id="fl-label"
              className={fieldInputClass}
              value={values.label}
              onChange={(event) => setField("label", event.target.value)}
            />
          </FormField>

          <FormField label="URL" htmlFor="fl-url" required error={errors.url} hint="A full URL or a relative path like /contact">
            <input
              id="fl-url"
              className={fieldInputClass}
              value={values.url}
              onChange={(event) => setField("url", event.target.value)}
            />
          </FormField>

          <FormField label="Icon" htmlFor="fl-icon" hint="Mainly for social links.">
            <div className="flex items-center gap-2">
              <select
                id="fl-icon"
                className={fieldInputClass}
                value={values.icon}
                onChange={(event) => setField("icon", event.target.value)}
              >
                {FOOTER_ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <IconPreview icon={values.icon} />
            </div>
          </FormField>

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

      {sections.length === 0 ? (
        <p className="text-sm text-stone">No footer links yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map(([section, sectionLinks]) => (
            <div key={section}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink">{section}</h3>
                <button
                  type="button"
                  onClick={() => openAddForm(section)}
                  className="text-xs font-medium text-ink underline"
                >
                  Add link here
                </button>
              </div>

              <ul className="mt-2 flex flex-col gap-2">
                {sectionLinks.map((link) => (
                  <li
                    key={link.id}
                    draggable
                    onDragStart={() => setDraggedId(link.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(section, link.id)}
                    className="flex cursor-move items-center gap-3 rounded-sm border border-sand bg-paper p-3 transition-colors hover:bg-sand/20"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.75} aria-hidden />
                    <IconPreview icon={link.icon} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{link.label}</p>
                      <p className="truncate text-xs text-stone">{link.url}</p>
                    </div>
                    <Badge variant={link.isActive ? "approved" : "pending"}>
                      {link.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => toggleActive(link)}
                      className="shrink-0 rounded-sm border border-ink px-2 py-1 text-xs text-ink hover:bg-sand"
                    >
                      {link.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      title="Edit footer link"
                      aria-label="Edit footer link"
                      onClick={() => openEditForm(link)}
                      className="shrink-0 rounded-sm p-1.5 text-stone transition-colors hover:bg-sand hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      title="Delete footer link"
                      aria-label="Delete footer link"
                      onClick={() => deleteLink(link)}
                      className="shrink-0 rounded-sm p-1.5 text-rejectedRed transition-colors hover:bg-rejectedRed/10"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
