import { listCitiesWithHomeFeature } from "@/lib/queries/admin-home-cities";
import { HomeCitiesManager } from "./HomeCitiesManager";

export default async function AdminHomeCitiesPage() {
  const cities = await listCitiesWithHomeFeature();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Browse by City</h1>
      <p className="mt-1 text-sm text-stone">
        Choose which cities appear in the home page&apos;s &quot;Browse by City&quot; section, and their icons.
      </p>

      <div className="mt-6">
        <HomeCitiesManager initialCities={cities} />
      </div>
    </div>
  );
}
