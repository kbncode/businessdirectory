import { listCountries } from "@/lib/queries/admin-master-data";
import { MasterDataManager } from "@/components/admin/MasterDataManager";

export default async function AdminCountriesPage() {
  const countries = await listCountries();

  return (
    <MasterDataManager
      tableSlug="countries"
      entityLabel="Country"
      items={countries.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
