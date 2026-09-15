"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField, fieldInputClass } from "@/components/ui/FormField";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { buttonClasses } from "@/components/ui/Button";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slug";
import {
  validatePageForm,
  SEO_TITLE_MAX,
  SEO_DESCRIPTION_MAX,
  type PageFormValues,
  type PageFormErrors,
} from "@/lib/page-validation";
import type { getPageForAdmin } from "@/lib/queries/admin-pages";

type ExistingPage = NonNullable<Awaited<ReturnType<typeof getPageForAdmin>>>;

interface PageEditorProps {
  mode: "create" | "edit";
  page?: ExistingPage;
}

export function PageEditor({ mode, page }: PageEditorProps) {
  const router = useRouter();
  const isAbout = page?.type === "ABOUT";

  const [values, setValues] = useState<PageFormValues>({
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    content: page?.content ?? "",
    status: page?.status ?? "DRAFT",
    seoTitle: page?.seoTitle ?? "",
    seoDescription: page?.seoDescription ?? "",
  });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<PageFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);

  const derivedSlug = useMemo(() => slugify(values.title), [values.title]);

  function setField<K extends keyof PageFormValues>(name: K, value: PageFormValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleTitleChange(title: string) {
    setValues((prev) => ({
      ...prev,
      title,
      // Slug tracks the title until the admin edits it directly — once
      // touched, retyping the title never silently changes the URL again.
      slug: slugTouched || isAbout ? prev.slug : slugify(title),
    }));
    setErrors((prev) => ({ ...prev, title: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const fieldErrors = validatePageForm(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setToast(null);

    const endpoint = mode === "edit" ? `/api/admin/pages/${page!.id}` : "/api/admin/pages";
    const method = mode === "edit" ? "PATCH" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setToast({ message: data.error ?? "Something went wrong. Please try again.", tone: "error" });
        return;
      }

      router.push("/admin/pages");
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

      <FormField label="Title" htmlFor="title" required error={errors.title}>
        <input
          id="title"
          className={fieldInputClass}
          value={values.title}
          onChange={(event) => handleTitleChange(event.target.value)}
        />
      </FormField>

      <FormField
        label="Slug"
        htmlFor="slug"
        required
        error={errors.slug}
        hint={
          isAbout
            ? "Fixed — the About page always lives at /about-us."
            : `Auto-generated from the title — edit directly if you want something different. Preview: /${values.slug || derivedSlug}`
        }
      >
        <input
          id="slug"
          className={cn(fieldInputClass, isAbout && "bg-sand text-stone")}
          value={values.slug}
          disabled={isAbout}
          onChange={(event) => {
            setSlugTouched(true);
            setField("slug", slugify(event.target.value));
          }}
        />
      </FormField>

      <FormField label="Content" htmlFor="content" required error={errors.content}>
        <TiptapEditor content={values.content} onChange={(html) => setField("content", html)} />
      </FormField>

      <div className="rounded-sm border border-sand bg-sand/20 p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">SEO (optional)</h2>

        <div className="mt-4 flex flex-col gap-4">
          <FormField
            label="SEO title"
            htmlFor="seoTitle"
            error={errors.seoTitle}
            hint={`${values.seoTitle.length}/${SEO_TITLE_MAX} — falls back to the page title if left blank.`}
          >
            <input
              id="seoTitle"
              className={fieldInputClass}
              value={values.seoTitle}
              onChange={(event) => setField("seoTitle", event.target.value)}
            />
          </FormField>

          <FormField
            label="SEO description"
            htmlFor="seoDescription"
            error={errors.seoDescription}
            hint={`${values.seoDescription.length}/${SEO_DESCRIPTION_MAX}`}
          >
            <textarea
              id="seoDescription"
              rows={2}
              className={fieldInputClass}
              value={values.seoDescription}
              onChange={(event) => setField("seoDescription", event.target.value)}
            />
          </FormField>
        </div>
      </div>

      <FormField label="Status" htmlFor="status" hint="Draft pages are never visible on the public site.">
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
        <button
          type="submit"
          disabled={submitting}
          className={cn(buttonClasses("primary"), "disabled:opacity-60")}
        >
          {submitting ? "Saving..." : "Save page"}
        </button>
        <button type="button" onClick={() => router.push("/admin/pages")} className={buttonClasses("secondary")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
