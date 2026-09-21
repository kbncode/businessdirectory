"use client";

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField, fieldInputClass } from "@/components/ui/FormField";
import { Honeypot } from "@/components/ui/Honeypot";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import { validateUploadFile } from "@/lib/file-validation";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, MAX_UPLOAD_BYTES } from "@/lib/upload-constants";
import {
  validateBusinessForm,
  type BusinessFormValues,
  type BusinessFormErrors,
} from "@/lib/business-form-validation";
import type { getFilterMasterData, getBusinessEntities, getBusinessTypes } from "@/lib/queries/business";

interface RegisterFormProps {
  masterData: Awaited<ReturnType<typeof getFilterMasterData>>;
  entities: Awaited<ReturnType<typeof getBusinessEntities>>;
  types: Awaited<ReturnType<typeof getBusinessTypes>>;
  /** "edit" (admin) and "owner-edit" (the listing's own submitter, via
   * /my-listings) both pre-fill the form and PATCH an existing listing
   * instead of creating a new PENDING one — they only differ in which
   * endpoint they hit and where they redirect afterward. Defaults to the
   * public registration flow. */
  mode?: "create" | "edit" | "owner-edit";
  businessId?: string;
  initialValues?: BusinessFormValues;
  initialPhotoUrl?: string | null;
  initialBrochureUrl?: string | null;
}

const EMPTY_VALUES: BusinessFormValues = {
  ownerName: "",
  businessName: "",
  establishedYear: "",
  entityId: "",
  typeId: "",
  businessPhone: "",
  personalPhone: "",
  email: "",
  website: "",
  mainCategoryId: "",
  subCategoryIds: [],
  countryId: "",
  stateId: "",
  city: "",
  area: "",
  nativePlace: "",
  address: "",
  about: "",
  productsServices: "",
  experience: "",
  socialLinks: "",
  additionalNote: "",
};

export function RegisterForm({
  masterData,
  entities,
  types,
  mode = "create",
  businessId,
  initialValues,
  initialPhotoUrl,
  initialBrochureUrl,
}: RegisterFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit" || mode === "owner-edit";

  const [values, setValues] = useState<BusinessFormValues>(initialValues ?? EMPTY_VALUES);
  const [errors, setErrors] = useState<BusinessFormErrors>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // The original, uncropped selection is kept around (even after cropping)
  // so "Recrop" can reopen the cropper against the source image instead of
  // re-cropping an already-cropped square, which would lose resolution and
  // context on every subsequent adjustment.
  const [originalPhotoSrc, setOriginalPhotoSrc] = useState<string | null>(null);
  const [originalPhotoName, setOriginalPhotoName] = useState<string>("photo");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [brochureError, setBrochureError] = useState<string | null>(null);
  const [brochureRemoved, setBrochureRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  const statesForCountry = useMemo(
    () => masterData.states.filter((s) => s.countryId === values.countryId),
    [masterData.states, values.countryId]
  );
  const stateRequired = statesForCountry.length > 0;

  const citiesForState = useMemo(
    () => masterData.cities.filter((c) => c.stateId === values.stateId),
    [masterData.cities, values.stateId]
  );

  const subCategoriesForMain = useMemo(
    () => masterData.subCategories.filter((s) => s.mainCategoryId === values.mainCategoryId),
    [masterData.subCategories, values.mainCategoryId]
  );

  function setField<K extends keyof BusinessFormValues>(name: K, value: BusinessFormValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleTextChange(name: keyof BusinessFormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setField(name, event.target.value);
  }

  function handleCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    setField("countryId", event.target.value);
    setField("stateId", "");
    setField("city", "");
    setField("area", "");
  }

  function handleStateChange(event: ChangeEvent<HTMLSelectElement>) {
    setField("stateId", event.target.value);
    setField("city", "");
    setField("area", "");
  }

  function handleMainCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    setField("mainCategoryId", event.target.value);
    setField("subCategoryIds", []);
  }

  function toggleSubCategory(id: string) {
    setValues((prev) => ({
      ...prev,
      subCategoryIds: prev.subCategoryIds.includes(id)
        ? prev.subCategoryIds.filter((v) => v !== id)
        : [...prev.subCategoryIds, id],
    }));
    setErrors((prev) => ({ ...prev, subCategoryIds: undefined }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhotoError(null);
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoRemoved(false);

    if (!file) return;

    const error = validateUploadFile(file, ALLOWED_IMAGE_TYPES);
    if (error) {
      setPhotoError(error);
      event.target.value = "";
      return;
    }

    // A photo is never accepted straight off the disk — it always goes
    // through the crop modal first, so every uploaded photo is a clean
    // square that fits the listing thumbnail.
    setOriginalPhotoName(file.name);
    setOriginalPhotoSrc(URL.createObjectURL(file));
    setCropModalOpen(true);
  }

  function handleCropped(file: File, previewUrl: string) {
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setCropModalOpen(false);
  }

  function handleCropCancel() {
    setCropModalOpen(false);
    if (!photoFile && photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoRemoved(true);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function handleUndoRemovePhoto() {
    setPhotoRemoved(false);
  }

  function handleRemoveBrochure() {
    setBrochureFile(null);
    setBrochureRemoved(true);
    if (brochureInputRef.current) brochureInputRef.current.value = "";
  }

  function handleUndoRemoveBrochure() {
    setBrochureRemoved(false);
  }

  function handleBrochureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setBrochureError(null);
    setBrochureFile(null);
    setBrochureRemoved(false);

    if (!file) return;

    const error = validateUploadFile(file, ALLOWED_DOCUMENT_TYPES);
    if (error) {
      setBrochureError(error);
      event.target.value = "";
      return;
    }

    setBrochureFile(file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validateBusinessForm(values, { stateRequired });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError(null);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (key === "subCategoryIds") continue;
      formData.set(key, String(value ?? ""));
    }
    for (const id of values.subCategoryIds) {
      formData.append("subCategoryIds", id);
    }
    if (photoFile) formData.set("photo", photoFile);
    if (brochureFile) formData.set("brochure", brochureFile);
    if (photoRemoved) formData.set("removePhoto", "true");
    if (brochureRemoved) formData.set("removeBrochure", "true");

    // The honeypot field isn't part of the `values` state above (it's never
    // meant to be a real field), so it has to be read straight off the DOM —
    // otherwise a bot filling it would have no effect at all.
    const rawFormData = new FormData(event.currentTarget as HTMLFormElement);
    formData.set("website_url", String(rawFormData.get("website_url") ?? ""));

    const endpoint =
      mode === "owner-edit"
        ? `/api/my-listings/${businessId}`
        : mode === "edit"
          ? `/api/admin/businesses/${businessId}`
          : "/api/businesses";
    const redirectTo = mode === "owner-edit" ? "/my-listings" : mode === "edit" ? "/admin/listings" : "/register/success";

    try {
      const res = isEdit
        ? await fetch(endpoint, { method: "PATCH", body: formData })
        : await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-10">
      <Honeypot />
      {submitError && (
        <div className="rounded-sm border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{submitError}</p>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="mt-2 text-xs font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* 1. Business Basics */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Business basics</h2>

        <FormField label="Your name" htmlFor="ownerName" required error={errors.ownerName}>
          <input
            id="ownerName"
            className={fieldInputClass}
            value={values.ownerName}
            onChange={handleTextChange("ownerName")}
          />
        </FormField>

        <FormField label="Business name" htmlFor="businessName" required error={errors.businessName}>
          <input
            id="businessName"
            className={fieldInputClass}
            value={values.businessName}
            onChange={handleTextChange("businessName")}
          />
        </FormField>

        <FormField
          label="Established year"
          htmlFor="establishedYear"
          error={errors.establishedYear}
          hint="Optional — e.g. 2015"
        >
          <input
            id="establishedYear"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            className={fieldInputClass}
            value={values.establishedYear}
            onChange={handleTextChange("establishedYear")}
          />
        </FormField>

        <FormField label="Business entity" htmlFor="entityId" required error={errors.entityId}>
          <select
            id="entityId"
            className={fieldInputClass}
            value={values.entityId}
            onChange={handleTextChange("entityId")}
          >
            <option value="">Select an entity type</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Business type" htmlFor="typeId" required error={errors.typeId}>
          <select id="typeId" className={fieldInputClass} value={values.typeId} onChange={handleTextChange("typeId")}>
            <option value="">Select a business type</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </FormField>
      </section>

      <SectionDivider />

      {/* 2. Contact */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Contact</h2>

        <FormField label="Business phone" htmlFor="businessPhone" required error={errors.businessPhone}>
          <input
            id="businessPhone"
            type="tel"
            className={fieldInputClass}
            value={values.businessPhone}
            onChange={handleTextChange("businessPhone")}
          />
        </FormField>

        <FormField label="Personal phone" htmlFor="personalPhone" error={errors.personalPhone}>
          <input
            id="personalPhone"
            type="tel"
            className={fieldInputClass}
            value={values.personalPhone}
            onChange={handleTextChange("personalPhone")}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            type="email"
            className={fieldInputClass}
            value={values.email}
            onChange={handleTextChange("email")}
          />
        </FormField>

        <FormField label="Website" htmlFor="website" error={errors.website} hint="Include https://">
          <input
            id="website"
            type="url"
            placeholder="https://example.com"
            className={fieldInputClass}
            value={values.website}
            onChange={handleTextChange("website")}
          />
        </FormField>
      </section>

      <SectionDivider />

      {/* 3. Category */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Category</h2>

        <FormField label="Main category" htmlFor="mainCategoryId" required error={errors.mainCategoryId}>
          <select
            id="mainCategoryId"
            className={fieldInputClass}
            value={values.mainCategoryId}
            onChange={handleMainCategoryChange}
          >
            <option value="">Select a main category</option>
            {masterData.mainCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        {values.mainCategoryId && (
          <FormField label="Sub-category" htmlFor="subCategoryIds" required error={errors.subCategoryIds}>
            {subCategoriesForMain.length === 0 ? (
              <p className="text-sm text-stone">No sub-categories for this category.</p>
            ) : (
              <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-sm border border-sand p-3">
                {subCategoriesForMain.map((sub) => (
                  <label key={sub.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={values.subCategoryIds.includes(sub.id)}
                      onChange={() => toggleSubCategory(sub.id)}
                      className="h-4 w-4 rounded-sm border-ink text-signalOrange focus:ring-signalOrange"
                    />
                    {sub.name}
                  </label>
                ))}
              </div>
            )}
          </FormField>
        )}
      </section>

      <SectionDivider />

      {/* 4. Location */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Location</h2>

        <FormField label="Country" htmlFor="countryId" required error={errors.countryId}>
          <select id="countryId" className={fieldInputClass} value={values.countryId} onChange={handleCountryChange}>
            <option value="">Select a country</option>
            {masterData.countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </FormField>

        {stateRequired && (
          <FormField label="State" htmlFor="stateId" required error={errors.stateId}>
            <select id="stateId" className={fieldInputClass} value={values.stateId} onChange={handleStateChange}>
              <option value="">Select a state</option>
              {statesForCountry.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="City" htmlFor="city" required error={errors.city}>
          {values.stateId && citiesForState.length > 0 ? (
            <select id="city" className={fieldInputClass} value={values.city} onChange={handleTextChange("city")}>
              <option value="">Select a city</option>
              {citiesForState.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          ) : (
            <input id="city" className={fieldInputClass} value={values.city} onChange={handleTextChange("city")} />
          )}
        </FormField>

        <FormField label="Area" htmlFor="area" error={errors.area}>
          <input id="area" className={fieldInputClass} value={values.area} onChange={handleTextChange("area")} />
        </FormField>

        <FormField label="Native place" htmlFor="nativePlace" error={errors.nativePlace}>
          <input
            id="nativePlace"
            className={fieldInputClass}
            value={values.nativePlace}
            onChange={handleTextChange("nativePlace")}
          />
        </FormField>

        <FormField label="Business address" htmlFor="address" error={errors.address}>
          <textarea
            id="address"
            rows={3}
            className={fieldInputClass}
            value={values.address}
            onChange={handleTextChange("address")}
          />
        </FormField>
      </section>

      <SectionDivider />

      {/* 5. About the Business */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">About the business</h2>

        <FormField label="About business" htmlFor="about" required error={errors.about}>
          <textarea
            id="about"
            rows={4}
            className={fieldInputClass}
            value={values.about}
            onChange={handleTextChange("about")}
          />
        </FormField>

        <FormField label="Products / services" htmlFor="productsServices" required error={errors.productsServices}>
          <textarea
            id="productsServices"
            rows={4}
            className={fieldInputClass}
            value={values.productsServices}
            onChange={handleTextChange("productsServices")}
          />
        </FormField>

        <FormField label="Work / project experience" htmlFor="experience" error={errors.experience}>
          <textarea
            id="experience"
            rows={3}
            className={fieldInputClass}
            value={values.experience}
            onChange={handleTextChange("experience")}
          />
        </FormField>

        <FormField
          label="Social media links"
          htmlFor="socialLinks"
          error={errors.socialLinks}
          hint="Comma or newline separated"
        >
          <textarea
            id="socialLinks"
            rows={2}
            className={fieldInputClass}
            value={values.socialLinks}
            onChange={handleTextChange("socialLinks")}
          />
        </FormField>
      </section>

      <SectionDivider />

      {/* 6. Uploads */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Uploads</h2>

        <div className="rounded-sm border border-signalOrange/40 bg-signalOrange/10 p-4 text-sm text-ink">
          <p className="font-medium">Photo: max 5MB. JPG, PNG, or WebP.</p>
          <p className="mt-1 text-ink/80">Your photo will be automatically resized and optimized.</p>
        </div>

        <FormField
          label="Photo / image"
          htmlFor="photo"
          error={photoError ?? undefined}
          hint={isEdit ? "Leave blank to keep the current photo." : undefined}
        >
          <input
            id="photo"
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="w-full text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-signalOrange file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
          />
          {photoPreview ? (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={photoPreview} alt="Selected photo preview" className="h-20 w-20 rounded-sm object-cover" />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-stone">
                  {photoFile?.name} ({photoFile ? formatBytes(photoFile.size) : ""})
                </span>
                <button
                  type="button"
                  onClick={() => setCropModalOpen(true)}
                  className="self-start text-xs font-medium text-ink underline"
                >
                  Recrop
                </button>
              </div>
            </div>
          ) : (
            isEdit &&
            initialPhotoUrl &&
            (photoRemoved ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-stone">Photo will be removed when you save.</span>
                <button type="button" onClick={handleUndoRemovePhoto} className="text-xs font-medium text-ink underline">
                  Undo
                </button>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- Blob/local-hosted current photo */}
                <img src={initialPhotoUrl} alt="Current photo" className="h-20 w-32 rounded-sm object-cover" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-stone">Current photo</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="self-start text-xs font-medium text-rejectedRed underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </FormField>

        <FormField
          label="Brochure / document"
          htmlFor="brochure"
          error={brochureError ?? undefined}
          hint={
            isEdit
              ? "Leave blank to keep the current file."
              : `PDF, DOC, DOCX, JPG, PNG, or WebP. Max ${formatBytes(MAX_UPLOAD_BYTES)}. Not compressed.`
          }
        >
          <input
            id="brochure"
            ref={brochureInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
            onChange={handleBrochureChange}
            className="w-full text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-signalOrange file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
          />
          {brochureFile ? (
            <p className="mt-2 text-xs text-stone">
              {brochureFile.name} ({formatBytes(brochureFile.size)})
            </p>
          ) : (
            isEdit &&
            initialBrochureUrl &&
            (brochureRemoved ? (
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs text-stone">Document will be removed when you save.</span>
                <button type="button" onClick={handleUndoRemoveBrochure} className="text-xs font-medium text-ink underline">
                  Undo
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <a href={initialBrochureUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-ink underline">
                  Current brochure
                </a>
                <button
                  type="button"
                  onClick={handleRemoveBrochure}
                  className="text-xs font-medium text-rejectedRed underline"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </FormField>
      </section>

      <SectionDivider />

      {/* 7. Additional Note */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Additional note</h2>
        <FormField label="Anything else?" htmlFor="additionalNote" error={errors.additionalNote}>
          <textarea
            id="additionalNote"
            rows={3}
            className={fieldInputClass}
            value={values.additionalNote}
            onChange={handleTextChange("additionalNote")}
          />
        </FormField>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className={cn(buttonClasses("primary"), "self-start disabled:opacity-60")}
      >
        {submitting ? "Saving..." : isEdit ? "Save changes" : "Submit for review"}
      </button>

      {cropModalOpen && originalPhotoSrc && (
        <ImageCropModal
          imageSrc={originalPhotoSrc}
          fileName={originalPhotoName}
          onCancel={handleCropCancel}
          onCropped={handleCropped}
        />
      )}
    </form>
  );
}
