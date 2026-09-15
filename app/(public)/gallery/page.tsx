import type { Metadata } from "next";
import { ImageOff } from "lucide-react";
import { getActiveGalleryImages } from "@/lib/queries/gallery";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gallery",
};

export default async function GalleryPage() {
  const images = await getActiveGalleryImages();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Gallery</h1>
      <p className="mt-2 text-sm text-stone">Photos from KBN Business Directory.</p>

      <div className="mt-8">
        {images.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-sm border border-sand bg-sand/20 py-16 text-center">
            <ImageOff className="h-8 w-8 text-stone" strokeWidth={1.75} />
            <p className="text-sm text-stone">No photos yet — check back soon.</p>
          </div>
        ) : (
          <GalleryGrid images={images} />
        )}
      </div>
    </div>
  );
}
