import { getAllGalleryImagesForAdmin } from "@/lib/queries/gallery";
import { GalleryManager } from "./GalleryManager";

export default async function AdminGalleryPage() {
  const images = await getAllGalleryImagesForAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Gallery</h1>
      <p className="mt-1 text-sm text-stone">Manage the photos shown on the public gallery page.</p>

      <div className="mt-6 rounded-sm border border-signalOrange/40 bg-signalOrange/10 p-4 text-sm text-ink">
        <p className="font-medium">Max 3MB. JPG, PNG, or WebP.</p>
        <p className="mt-1 text-stone">Automatically compressed and optimized after upload.</p>
      </div>

      <div className="mt-6">
        <GalleryManager initialImages={images} />
      </div>
    </div>
  );
}
