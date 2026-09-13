import { listBusinessMainCategories } from "@/lib/queries/admin-master-data";
import { MasterDataManager } from "@/components/admin/MasterDataManager";

export default async function AdminBusinessMainCategoriesPage() {
  const categories = await listBusinessMainCategories();

  return (
    <MasterDataManager
      tableSlug="business-main-categories"
      entityLabel="Main category"
      items={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
