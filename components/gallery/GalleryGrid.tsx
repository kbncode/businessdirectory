"use client";

import { useEffect, useState } from "react";
import type { GalleryImage } from "@prisma/client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface GalleryGridProps {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const current = openIndex !== null ? images[openIndex] : null;

  function close() {
    setOpenIndex(null);
  }
  function showPrev() {
    setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }
  function showNext() {
    setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
  }

  useEffect(() => {
    if (openIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, images.length]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group overflow-hidden rounded-sm border border-sand bg-sand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Blob-hosted photo, host not known ahead of time */}
            <img
              src={image.imageUrl}
              alt={image.caption ?? "Gallery photo"}
              className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={close}
          role="presentation"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 text-paper hover:text-signalOrange"
          >
            <X className="h-7 w-7" strokeWidth={1.75} />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrev();
              }}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-paper hover:text-signalOrange sm:left-6"
            >
              <ChevronLeft className="h-8 w-8" strokeWidth={1.75} />
            </button>
          )}

          <div
            className="flex max-h-[85vh] max-w-3xl flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Blob-hosted photo, host not known ahead of time */}
            <img
              src={current.imageUrl}
              alt={current.caption ?? "Gallery photo"}
              className="max-h-[75vh] w-auto rounded-sm object-contain"
            />
            {current.caption && <p className="text-center text-sm text-paper">{current.caption}</p>}
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-paper hover:text-signalOrange sm:right-6"
            >
              <ChevronRight className="h-8 w-8" strokeWidth={1.75} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
