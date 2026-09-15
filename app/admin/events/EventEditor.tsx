"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@prisma/client";
import { FormField, fieldInputClass } from "@/components/ui/FormField";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { buttonClasses } from "@/components/ui/Button";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slug";
import { toDatetimeLocalValue } from "@/lib/format";
import { validateEventForm, type EventFormValues, type EventFormErrors } from "@/lib/event-validation";

interface EventEditorProps {
  mode: "create" | "edit";
  event?: Event;
}

const EMPTY_VALUES: EventFormValues = {
  title: "",
  slug: "",
  description: "",
  eventDate: "",
  endDate: "",
  location: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  isFeatured: false,
  status: "DRAFT",
};

function toFormValues(event: Event): EventFormValues {
  return {
    title: event.title,
    slug: event.slug,
    description: event.description,
    eventDate: toDatetimeLocalValue(event.eventDate),
    endDate: event.endDate ? toDatetimeLocalValue(event.endDate) : "",
    location: event.location ?? "",
    contactName: event.contactName ?? "",
    contactPhone: event.contactPhone ?? "",
    contactEmail: event.contactEmail ?? "",
    isFeatured: event.isFeatured,
    status: event.status,
  };
}

// The datetime-local input's value ("YYYY-MM-DDTHH:mm") has no timezone —
// appending Z treats those digits as the literal, sacred value to store and
// later display (matching toDatetimeLocalValue's UTC-field extraction and
// formatDate/formatDateTime's UTC-pinned rendering elsewhere in the app),
// rather than letting the browser reinterpret them through its own
// timezone via bare `new Date(...)` parsing.
function toIsoWithZ(datetimeLocalValue: string) {
  return datetimeLocalValue ? `${datetimeLocalValue}:00.000Z` : "";
}

export function EventEditor({ mode, event }: EventEditorProps) {
  const router = useRouter();

  const [values, setValues] = useState<EventFormValues>(event ? toFormValues(event) : EMPTY_VALUES);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);

  function setField<K extends keyof EventFormValues>(name: K, value: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleTitleChange(title: string) {
    setValues((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
    setErrors((prev) => ({ ...prev, title: undefined }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhotoError(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("File must be JPG, PNG, or WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError("File must be 3MB or smaller.");
      event.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const fieldErrors = validateEventForm(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setToast(null);

    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("slug", values.slug);
    formData.set("description", values.description);
    formData.set("eventDate", toIsoWithZ(values.eventDate));
    formData.set("endDate", toIsoWithZ(values.endDate));
    formData.set("location", values.location);
    formData.set("contactName", values.contactName);
    formData.set("contactPhone", values.contactPhone);
    formData.set("contactEmail", values.contactEmail);
    formData.set("isFeatured", String(values.isFeatured));
    formData.set("status", values.status);
    if (photoFile) formData.set("photo", photoFile);

    try {
      const endpoint = mode === "edit" ? `/api/admin/events/${event!.id}` : "/api/admin/events";
      const res = await fetch(endpoint, { method: mode === "edit" ? "PATCH" : "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setToast({ message: data.error ?? "Something went wrong. Please try again.", tone: "error" });
        return;
      }

      router.push("/admin/events");
      router.refresh();
    } catch {
      setToast({ message: "Something went wrong. Please try again.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      <FormField label="Title" htmlFor="ev-title" required error={errors.title}>
        <input
          id="ev-title"
          className={fieldInputClass}
          value={values.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
      </FormField>

      <FormField
        label="Slug"
        htmlFor="ev-slug"
        required
        error={errors.slug}
        hint={`Preview: /events/${values.slug || slugify(values.title)}`}
      >
        <input
          id="ev-slug"
          className={fieldInputClass}
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setField("slug", slugify(e.target.value));
          }}
        />
      </FormField>

      <FormField label="Description" htmlFor="ev-description" required error={errors.description}>
        <TiptapEditor content={values.description} onChange={(html) => setField("description", html)} />
      </FormField>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <FormField label="Event date & time" htmlFor="ev-date" required error={errors.eventDate}>
            <input
              id="ev-date"
              type="datetime-local"
              className={fieldInputClass}
              value={values.eventDate}
              onChange={(e) => setField("eventDate", e.target.value)}
            />
          </FormField>
        </div>
        <div className="flex-1">
          <FormField label="End date & time" htmlFor="ev-end-date" error={errors.endDate} hint="Optional">
            <input
              id="ev-end-date"
              type="datetime-local"
              className={fieldInputClass}
              value={values.endDate}
              onChange={(e) => setField("endDate", e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <FormField label="Location" htmlFor="ev-location" error={errors.location}>
        <input
          id="ev-location"
          className={fieldInputClass}
          value={values.location}
          onChange={(e) => setField("location", e.target.value)}
        />
      </FormField>

      <FormField label="Event photo" htmlFor="ev-photo" error={photoError ?? undefined} hint="Max 3MB. JPG, PNG, or WebP. Automatically compressed and optimized after upload.">
        <input
          id="ev-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="w-full text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-signalOrange file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
        />
        {photoPreview ? (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={photoPreview} alt="Selected photo preview" className="h-24 w-40 rounded-sm border border-sand object-cover" />
          </div>
        ) : (
          event?.photoUrl && (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- Blob-hosted current photo */}
              <img src={event.photoUrl} alt="Current photo" className="h-24 w-40 rounded-sm border border-sand object-cover" />
              <span className="text-xs text-stone">Current photo — leave blank to keep it.</span>
            </div>
          )
        )}
      </FormField>

      <div className="rounded-sm border border-sand bg-sand/20 p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">
          Contact (optional, shown publicly)
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          <FormField label="Contact name" htmlFor="ev-contact-name" error={errors.contactName}>
            <input
              id="ev-contact-name"
              className={fieldInputClass}
              value={values.contactName}
              onChange={(e) => setField("contactName", e.target.value)}
            />
          </FormField>
          <FormField label="Contact phone" htmlFor="ev-contact-phone" error={errors.contactPhone}>
            <input
              id="ev-contact-phone"
              type="tel"
              className={fieldInputClass}
              value={values.contactPhone}
              onChange={(e) => setField("contactPhone", e.target.value)}
            />
          </FormField>
          <FormField label="Contact email" htmlFor="ev-contact-email" error={errors.contactEmail}>
            <input
              id="ev-contact-email"
              type="email"
              className={fieldInputClass}
              value={values.contactEmail}
              onChange={(e) => setField("contactEmail", e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={values.isFeatured}
          onChange={(e) => setField("isFeatured", e.target.checked)}
          className="h-4 w-4 rounded-sm border-ink text-signalOrange focus:ring-signalOrange"
        />
        Featured on home page
      </label>

      <FormField label="Status" htmlFor="ev-status" hint="Draft events are never visible on the public site.">
        <div className="flex gap-2">
          {(["DRAFT", "PUBLISHED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setField("status", status)}
              className={cn(
                "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                values.status === status ? "bg-signalOrange text-ink" : "bg-sand text-stone hover:text-ink"
              )}
            >
              {status === "DRAFT" ? "Draft" : "Published"}
            </button>
          ))}
        </div>
      </FormField>

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className={cn(buttonClasses("primary"), "disabled:opacity-60")}>
          {submitting ? "Saving..." : "Save event"}
        </button>
        <button type="button" onClick={() => router.push("/admin/events")} className={buttonClasses("secondary")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
