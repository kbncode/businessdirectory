import { getAllHeroImagesForAdmin } from "@/lib/queries/hero-images";
import { HeroImagesManager } from "./HeroImagesManager";

export default async function AdminHeroImagesPage() {
  const images = await getAllHeroImagesForAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Hero Images</h1>
      <p className="mt-1 text-sm text-stone">Manage the rotating hero images shown on the home page.</p>

      <div className="mt-6 rounded-sm border border-signalOrange/40 bg-signalOrange/10 p-4 text-sm text-ink">
        <p className="font-medium">Recommended: 1920&times;800px or wider, 16:7 landscape ratio.</p>
        <p className="mt-1 text-stone">
          Formats: JPG, PNG, or WebP. Max file size: 5MB. Your image will be automatically compressed and optimized
          after upload.
        </p>
      </div>

      <div className="mt-6">
        <HeroImagesManager initialImages={images} />
      </div>
    </div>
  );
}
