import { getHeaderMenuItemsForAdmin } from "@/lib/queries/admin-header-menu";
import { getPublishedPagesForSelect } from "@/lib/queries/admin-pages";
import { HeaderMenuManager } from "./HeaderMenuManager";

export default async function AdminHeaderMenuPage() {
  const [items, publishedPages] = await Promise.all([getHeaderMenuItemsForAdmin(), getPublishedPagesForSelect()]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Header menu</h1>
      <p className="mt-1 text-sm text-stone">
        Manage the nav links shown between the search icon and the account controls.
      </p>

      <div className="mt-6">
        <HeaderMenuManager initialItems={items} publishedPages={publishedPages} />
      </div>
    </div>
  );
}
