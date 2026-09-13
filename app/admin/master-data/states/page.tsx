import { listStates, listCountries } from "@/lib/queries/admin-master-data";
import { MasterDataManager } from "@/components/admin/MasterDataManager";

export default async function AdminStatesPage() {
  const [states, countries] = await Promise.all([listStates(), listCountries()]);

  return (
    <MasterDataManager
      tableSlug="states"
      entityLabel="State"
      items={states.map((s) => ({ id: s.id, name: s.name, parentId: s.countryId }))}
      parentOptions={countries.map((c) => ({ id: c.id, name: c.name }))}
      parentLabel="Country"
    />
  );
}
