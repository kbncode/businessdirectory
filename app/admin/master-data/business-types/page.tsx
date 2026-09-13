import { listBusinessTypes } from "@/lib/queries/admin-master-data";
import { MasterDataManager } from "@/components/admin/MasterDataManager";

export default async function AdminBusinessTypesPage() {
  const types = await listBusinessTypes();

  return (
    <MasterDataManager
      tableSlug="business-types"
      entityLabel="Business type"
      items={types.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
