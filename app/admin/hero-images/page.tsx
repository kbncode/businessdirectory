import { getAllHeroImagesForAdmin } from "@/lib/queries/hero-images";
import { HeroImagesManager } from "./HeroImagesManager";

export default async function AdminHeroImagesPage() {
  const images = await getAllHeroImagesForAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Hero Images</h1>
      <p className="mt-1 text-sm text-stone">Manage the rotating hero images shown on the home page.</p>

      <div className="mt-6 rounded-sm border border-signalOrange/40 bg-signalOrange/10 p-4 text-sm text-ink">
        <p className="font-medium">Formats: JPG, PNG, or WebP. Max file size: 5MB.</p>
        <p className="mt-1 text-stone">
          After choosing a file, crop it to the 1920&times;800 banner shape — this is exactly how it displays live,
          so what you crop is what visitors see. Compressed and optimized automatically after upload.
        </p>
      </div>

      <div className="mt-6">
        <HeroImagesManager initialImages={images} />
      </div>
    </div>
  );
}
