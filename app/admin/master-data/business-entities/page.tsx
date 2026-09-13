import { listBusinessEntities } from "@/lib/queries/admin-master-data";
import { MasterDataManager } from "@/components/admin/MasterDataManager";

export default async function AdminBusinessEntitiesPage() {
  const entities = await listBusinessEntities();

  return (
    <MasterDataManager
      tableSlug="business-entities"
      entityLabel="Business entity"
      items={entities.map((e) => ({ id: e.id, name: e.name }))}
    />
  );
}
