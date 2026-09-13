import { listBusinessSubCategories, listBusinessMainCategories } from "@/lib/queries/admin-master-data";
import { MasterDataManager } from "@/components/admin/MasterDataManager";

export default async function AdminBusinessSubCategoriesPage() {
  const [subCategories, mainCategories] = await Promise.all([
    listBusinessSubCategories(),
    listBusinessMainCategories(),
  ]);

  return (
    <MasterDataManager
      tableSlug="business-sub-categories"
      entityLabel="Sub-category"
      items={subCategories.map((s) => ({ id: s.id, name: s.name, parentId: s.mainCategoryId }))}
      parentOptions={mainCategories.map((c) => ({ id: c.id, name: c.name }))}
      parentLabel="Main category"
      searchable
      paginated
    />
  );
}
