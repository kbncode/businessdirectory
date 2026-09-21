"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImageOff } from "lucide-react";
import { validateUploadFile } from "@/lib/file-validation";
import { ALLOWED_CITY_ICON_TYPES, MAX_CITY_ICON_BYTES } from "@/lib/city-icon-constants";

interface CityIconControlProps {
  cityId: string;
  iconUrl: string | null;
  onUploaded: (iconUrl: string) => void;
  onRemoved: () => void;
}

// Shared by both the main city list row and the "Currently Featured"
// reorder section — same upload/replace/remove control either place, both
// reading/writing the one lifted `cities` state in HomeCitiesManager.
export function CityIconControl({ cityId, iconUrl, onUploaded, onRemoved }: CityIconControlProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    if (!file) return;

    const validationError = validateUploadFile(file, ALLOWED_CITY_ICON_TYPES, MAX_CITY_ICON_BYTES);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setBusy(true);
    const formData = new FormData();
    formData.set("icon", file);
    try {
      const res = await fetch(`/api/admin/home-cities/${cityId}/icon`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      onUploaded(data.iconUrl);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/home-cities/${cityId}/icon`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to remove icon.");
        return;
      }
      onRemoved();
    } catch {
      setError("Failed to remove icon.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Blob-hosted icon, host not known ahead of time
        <img src={iconUrl} alt="" className="h-8 w-8 shrink-0 rounded-sm border border-sand object-cover" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-dashed border-sand text-stone">
          <ImageOff className="h-4 w-4" strokeWidth={1.75} />
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={busy}
        className="w-44 text-xs text-ink file:mr-2 file:rounded-sm file:border-0 file:bg-sand file:px-2 file:py-1 file:text-xs file:font-medium file:text-ink disabled:opacity-60"
      />

      {iconUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="text-xs font-medium text-rejectedRed underline disabled:opacity-40"
        >
          Remove
        </button>
      )}

      {error && <span className="text-xs text-rejectedRed">{error}</span>}
    </div>
  );
}
