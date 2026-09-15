"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// The on-screen crop window is sized from this fixed width, with height
// derived from the requested aspect ratio — a landscape hero crop and a
// square photo crop each get a viewport shaped like their actual target,
// not a fixed square shoehorned around every use.
const VIEWPORT_WIDTH = 360;
const MAX_ZOOM = 3;

interface ImageCropModalProps {
  imageSrc: string;
  fileName: string;
  /** width / height of both the crop window and the exported image. Defaults to 1 (square). */
  aspectRatio?: number;
  /** Exported image width in px; height is derived from aspectRatio. Defaults to 1200. */
  outputWidth?: number;
  onCancel: () => void;
  onCropped: (file: File, previewUrl: string) => void;
}

export function ImageCropModal({
  imageSrc,
  fileName,
  aspectRatio = 1,
  outputWidth = 1200,
  onCancel,
  onCropped,
}: ImageCropModalProps) {
  const viewportWidth = VIEWPORT_WIDTH;
  const viewportHeight = Math.round(VIEWPORT_WIDTH / aspectRatio);
  const outputHeight = Math.round(outputWidth / aspectRatio);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  // baseScale is the "zoom 1" scale — the smallest scale that still fully
  // covers the crop viewport, so the user can never leave gaps at the edge.
  const baseScale = useMemo(() => {
    if (!naturalSize) return 1;
    return Math.max(viewportWidth / naturalSize.width, viewportHeight / naturalSize.height);
  }, [naturalSize, viewportWidth, viewportHeight]);

  const scale = baseScale * zoom;

  function clamp(next: { x: number; y: number }, currentScale: number) {
    if (!naturalSize) return next;
    const scaledWidth = naturalSize.width * currentScale;
    const scaledHeight = naturalSize.height * currentScale;
    const minX = Math.min(0, viewportWidth - scaledWidth);
    const minY = Math.min(0, viewportHeight - scaledHeight);
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
    const initialScale = Math.max(viewportWidth / width, viewportHeight / height);
    setPos({
      x: (viewportWidth - width * initialScale) / 2,
      y: (viewportHeight - height * initialScale) / 2,
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
    const sourceWidth = viewportWidth / scale;
    const sourceHeight = viewportHeight / scale;

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;

    const croppedName = fileName.replace(/\.[^/.]+$/, "") + "-cropped.jpg";
    const file = new File([blob], croppedName, { type: "image/jpeg" });
    onCropped(file, URL.createObjectURL(blob));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="w-full max-w-md rounded-sm border border-sand bg-paper p-5 shadow-lg">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-stone">Adjust image</h3>
        <p className="mt-1 text-xs text-stone">
          Drag to reposition and use the slider to zoom, so your image fits neatly in the frame.
        </p>

        <div
          className="relative mx-auto mt-4 touch-none overflow-hidden rounded-sm border border-sand bg-sand"
          style={{ width: viewportWidth, height: viewportHeight }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- transformed via canvas, not eligible for next/image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Image being cropped"
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
