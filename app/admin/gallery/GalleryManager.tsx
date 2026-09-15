"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { GalleryImage } from "@prisma/client";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import { ALLOWED_GALLERY_IMAGE_TYPES, MAX_GALLERY_IMAGE_BYTES } from "@/lib/gallery-constants";
import { validateUploadFile } from "@/lib/file-validation";

interface GalleryManagerProps {
  initialImages: GalleryImage[];
}

function validateFile(file: File): string | null {
  return validateUploadFile(file, ALLOWED_GALLERY_IMAGE_TYPES, MAX_GALLERY_IMAGE_BYTES);
}

export function GalleryManager({ initialImages }: GalleryManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [caption, setCaption] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError(null);
    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        event.target.value = "";
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setFileError("Choose an image to upload.");
      return;
    }
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }

    setUploading(true);
    setFileError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (caption.trim()) formData.append("caption", caption.trim());

    try {
      const res = await fetch("/api/admin/gallery", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error ?? "Upload failed.", tone: "error" });
        return;
      }

      setImages((prev) => [...prev, data.galleryImage]);
      setToast({
        message: `Uploaded — ${formatBytes(data.originalBytes)} compressed to ${formatBytes(data.compressedBytes)}`,
        tone: "success",
      });
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setToast({ message: "Upload failed. Please try again.", tone: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, isActive } : img)));

    const res = await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });

    if (!res.ok) {
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, isActive: !isActive } : img)));
      setToast({ message: "Failed to update image.", tone: "error" });
    }
  }

  async function saveCaption(id: string, nextCaption: string) {
    const previous = images.find((img) => img.id === id)?.caption ?? null;
    if (previous === (nextCaption || null)) return;

    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption: nextCaption || null } : img)));

    const res = await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: nextCaption }),
    });

    if (!res.ok) {
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption: previous } : img)));
      setToast({ message: "Failed to update caption.", tone: "error" });
    }
  }

  async function deleteImage(id: string) {
    if (!window.confirm("Delete this gallery image?")) return;

    const previous = images;
    setImages((prev) => prev.filter((img) => img.id !== id));

    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setImages(previous);
      setToast({ message: "Failed to delete image.", tone: "error" });
    }
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setImages((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((img) => img.id === draggedId);
      const toIndex = next.findIndex((img) => img.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      fetch("/api/admin/gallery/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((img) => img.id) }),
      }).catch(() => {
        setToast({ message: "Failed to save new order.", tone: "error" });
      });

      return next;
    });

    setDraggedId(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-sm border border-sand bg-paper p-5">
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="gallery-file">
            Image file
          </label>
          <input
            id="gallery-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="mt-1 w-full text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-signalOrange file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="gallery-caption">
            Caption
          </label>
          <input
            id="gallery-caption"
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange"
          />
        </div>

        {fileError && <p className="text-sm text-rejectedRed">{fileError}</p>}

        <button
          type="submit"
          disabled={uploading}
          className={cn(buttonClasses("primary"), "self-start disabled:opacity-60")}
        >
          {uploading ? "Uploading..." : "Upload image"}
        </button>
      </form>

      <div>
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-stone">
          Gallery images ({images.length})
        </h2>

        {images.length === 0 ? (
          <p className="mt-3 text-sm text-stone">No gallery images uploaded yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => setDraggedId(image.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(image.id)}
                className="flex cursor-move flex-col gap-2 rounded-sm border border-sand bg-paper p-2 transition-colors hover:bg-sand/20"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Blob-hosted thumbnail, host not known ahead of time */}
                  <img
                    src={image.imageUrl}
                    alt={image.caption ?? "Gallery image"}
                    className="aspect-square w-full rounded-sm border border-sand object-cover"
                  />
                  <span className="absolute left-1.5 top-1.5 rounded-sm bg-paper/90 p-1" title="Drag to reorder">
                    <GripVertical className="h-3.5 w-3.5 text-stone" strokeWidth={1.75} aria-hidden />
                  </span>
                </div>

                <input
                  type="text"
                  defaultValue={image.caption ?? ""}
                  placeholder="Caption"
                  onBlur={(event) => saveCaption(image.id, event.target.value.trim())}
                  className="w-full rounded-sm border border-sand bg-paper px-2 py-1 text-xs text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange"
                />

                <p className="text-[11px] text-stone">
                  {image.width}&times;{image.height}
                  {image.originalSizeKb ? ` · ${image.originalSizeKb}KB` : ""}
                </p>

                <div className="flex items-center justify-between gap-1">
                  <Badge variant={image.isActive ? "approved" : "pending"}>
                    {image.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleActive(image.id, !image.isActive)}
                      className="rounded-sm border border-ink px-1.5 py-0.5 text-[11px] text-ink hover:bg-sand"
                    >
                      {image.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      title="Delete image"
                      aria-label="Delete image"
                      onClick={() => deleteImage(image.id)}
                      className="rounded-sm p-1 text-rejectedRed transition-colors hover:bg-rejectedRed/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
