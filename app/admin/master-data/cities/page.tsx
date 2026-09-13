import { listCities, listStates } from "@/lib/queries/admin-master-data";
import { MasterDataManager } from "@/components/admin/MasterDataManager";

export default async function AdminCitiesPage() {
  const [cities, states] = await Promise.all([listCities(), listStates()]);

  return (
    <MasterDataManager
      tableSlug="cities"
      entityLabel="City"
      items={cities.map((c) => ({ id: c.id, name: c.name, parentId: c.stateId }))}
      parentOptions={states.map((s) => ({ id: s.id, name: s.name }))}
      parentLabel="State"
      searchable
      paginated
    />
  );
}
