"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface HeroCarouselImage {
  id: string;
  imageUrl: string;
  altText: string;
}

interface HeroCarouselProps {
  images: HeroCarouselImage[];
}

const AUTO_ADVANCE_MS = 5000;

export function HeroCarousel({ images }: HeroCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  function scrollToIndex(nextIndex: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = (nextIndex + images.length) % images.length;
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  useEffect(() => {
    if (paused || images.length <= 1) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      scrollToIndex(index + 1);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arm the timer whenever index/paused changes
  }, [index, paused, images.length]);

  if (images.length === 0) return null;

  return (
    <div
      className="group relative overflow-hidden rounded-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        // Pinned to 1920x800 (12:5) — the same ratio the admin crop modal
        // exports at — so a crop the admin approves renders exactly as
        // approved instead of being cropped a second time by a mismatched
        // fixed-height container at different viewport widths.
        className="no-scrollbar flex aspect-[12/5] snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {images.map((image) => (
          <div key={image.id} className="h-full w-full shrink-0 snap-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- Blob-hosted image, host not known ahead of time */}
            <img src={image.imageUrl} alt={image.altText} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(index - 1)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-sm bg-paper/80 px-2 py-1 text-ink opacity-0 transition-opacity hover:bg-paper group-hover:opacity-100 sm:block"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(index + 1)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-sm bg-paper/80 px-2 py-1 text-ink opacity-0 transition-opacity hover:bg-paper group-hover:opacity-100 sm:block"
          >
            &rarr;
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-signalOrange" : "bg-paper/70")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
