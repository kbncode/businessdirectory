import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { HeroCarousel } from "@/components/HeroCarousel";
import { EventCard } from "@/components/events/EventCard";
import { getMainCategories, getFeaturedBusinesses } from "@/lib/queries/business";
import { getActiveHeroImages } from "@/lib/queries/hero-images";
import { getFeaturedUpcomingEvents } from "@/lib/queries/events";
import { formatBusinessLocation } from "@/lib/format";

const CATEGORY_PREVIEW_COUNT = 12;

export default async function HomePage() {
  const [mainCategories, featuredBusinesses, heroImages, featuredEvents] = await Promise.all([
    getMainCategories(),
    getFeaturedBusinesses(),
    getActiveHeroImages(),
    getFeaturedUpcomingEvents(3),
  ]);

  const previewCategories = mainCategories.slice(0, CATEGORY_PREVIEW_COUNT);

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="bg-paper py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          {heroImages.length > 0 ? (
            // A real hero photo has been uploaded via /admin/hero-images —
            // use it. This is the "swap in a real image later" path for the
            // placeholder banner below: upload one in admin, no code change
            // needed.
            <div className="mb-10 overflow-hidden rounded-sm">
              <HeroCarousel
                images={heroImages.map((image) => ({
                  id: image.id,
                  imageUrl: image.imageUrl,
                  altText: image.altText,
                }))}
              />
            </div>
          ) : (
            /* TODO: replace with real hero photography — upload one via
               /admin/hero-images (renders through HeroCarousel above once
               present), or swap this div for a static <Image src="..."/>. */
            <div
              className="relative mb-10 h-[320px] w-full overflow-hidden rounded-sm sm:h-[360px] md:h-[400px]"
              style={{
                background:
                  "radial-gradient(120% 140% at 12% 15%, #FDFBF8 0%, #F5EEE3 45%, #EFE7DC 100%)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(55% 65% at 88% 12%, rgba(240,104,38,0.10), transparent 70%)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(60% 70% at 8% 95%, rgba(240,104,38,0.06), transparent 70%)",
                }}
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Discover businesses. Connect with the community.
            </h1>

            <form action="/browse" method="GET" className="mt-6 w-full max-w-xl">
              <label htmlFor="home-search" className="sr-only">
                Search businesses
              </label>
              <div className="flex">
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Search by business name, product or service"
                  className="w-full rounded-sm border border-ink bg-paper px-4 py-3 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange"
                />
                <button
                  type="submit"
                  className="ml-2 shrink-0 rounded-sm bg-signalOrange px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-signalOrange/90"
                >
                  Search
                </button>
              </div>
            </form>

            <p className="font-body text-sm text-stone">
              Find businesses, products and services across the KBN network
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="bg-sand/30 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-stone">
            Browse by category
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink">Explore the KBN network</h2>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {previewCategories.map((category) => (
              <CategoryTile key={category.id} label={category.name} href={`/browse?mainCategory=${category.id}`} />
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-signalOrange hover:underline"
            >
              Browse all
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Featured listings ---------- */}
      <section className="bg-paper py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-stone">
                Featured listings
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">Featured on KBN</h2>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-signalOrange hover:underline"
            >
              View all businesses
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>

          {featuredBusinesses.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone">No featured businesses right now.</p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredBusinesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  href={`/business/${business.slug}`}
                  name={business.businessName}
                  location={formatBusinessLocation(business)}
                  category={business.mainCategory.name}
                  about={business.about ?? business.productsServices ?? ""}
                  photoUrl={business.photoUrl}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Upcoming events ---------- */}
      {featuredEvents.length > 0 && (
        <section className="bg-sand/30 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-stone">
                  Upcoming events
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-ink">What&apos;s happening at KBN</h2>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-signalOrange hover:underline"
              >
                View all events
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
