"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const VIEWPORT_SIZE = 300; // on-screen crop window, square
const OUTPUT_SIZE = 800; // exported image is always this many px square
const MAX_ZOOM = 3;

interface ImageCropModalProps {
  imageSrc: string;
  fileName: string;
  onCancel: () => void;
  onCropped: (file: File, previewUrl: string) => void;
}

export function ImageCropModal({ imageSrc, fileName, onCancel, onCropped }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  // baseScale is the "zoom 1" scale — the smallest scale that still fully
  // covers the square viewport, so the user can never leave gaps at the edge.
  const baseScale = useMemo(() => {
    if (!naturalSize) return 1;
    return Math.max(VIEWPORT_SIZE / naturalSize.width, VIEWPORT_SIZE / naturalSize.height);
  }, [naturalSize]);

  const scale = baseScale * zoom;

  function clamp(next: { x: number; y: number }, currentScale: number) {
    if (!naturalSize) return next;
    const scaledWidth = naturalSize.width * currentScale;
    const scaledHeight = naturalSize.height * currentScale;
    const minX = Math.min(0, VIEWPORT_SIZE - scaledWidth);
    const minY = Math.min(0, VIEWPORT_SIZE - scaledHeight);
    return {
      x: Math.min(0, Math.max(next.x, minX)),
      y: Math.min(0, Math.max(next.y, minY)),
    };
  }

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    setNaturalSize({ width, height });
    const initialScale = Math.max(VIEWPORT_SIZE / width, VIEWPORT_SIZE / height);
    setPos({
      x: (VIEWPORT_SIZE - width * initialScale) / 2,
      y: (VIEWPORT_SIZE - height * initialScale) / 2,
    });
    setZoom(1);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { startX: event.clientX, startY: event.clientY, posX: pos.x, posY: pos.y };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    setPos(clamp({ x: dragState.current.posX + dx, y: dragState.current.posY + dy }, scale));
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleZoomChange(nextZoom: number) {
    setZoom(nextZoom);
    setPos((prev) => clamp(prev, baseScale * nextZoom));
  }

  // Re-clamp whenever scale changes so a zoom-out never leaves the image
  // stranded outside the viewport bounds from a previous drag.
  useEffect(() => {
    setPos((prev) => clamp(prev, scale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  async function handleApply() {
    const img = imgRef.current;
    if (!img || !naturalSize) return;

    const sourceX = -pos.x / scale;
    const sourceY = -pos.y / scale;
    const sourceSize = VIEWPORT_SIZE / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;

    const croppedName = fileName.replace(/\.[^/.]+$/, "") + "-cropped.jpg";
    const file = new File([blob], croppedName, { type: "image/jpeg" });
    onCropped(file, URL.createObjectURL(blob));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="w-full max-w-sm rounded-sm border border-sand bg-paper p-5 shadow-lg">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Adjust photo</h3>
        <p className="mt-1 text-xs text-stone">
          Drag to reposition and use the slider to zoom, so your photo fits neatly in the square thumbnail.
        </p>

        <div
          className="relative mx-auto mt-4 touch-none overflow-hidden rounded-sm border border-sand bg-sand"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- transformed via canvas, not eligible for next/image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Photo being cropped"
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute left-0 top-0 max-w-none origin-top-left select-none"
            style={
              naturalSize
                ? {
                    width: naturalSize.width * scale,
                    height: naturalSize.height * scale,
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                  }
                : undefined
            }
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-stone">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => handleZoomChange(Number(event.target.value))}
            className="w-full accent-signalOrange"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={cn(buttonClasses("secondary"), "text-sm")}>
            Cancel
          </button>
          <button type="button" onClick={handleApply} className={cn(buttonClasses("primary"), "text-sm")}>
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}
