import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { getPagesForAdmin } from "@/lib/queries/admin-pages";
import { PagesTable } from "./PagesTable";

export default async function AdminPagesListPage() {
  const pages = await getPagesForAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">Pages</h1>
        <Link href="/admin/pages/new" className={buttonClasses("primary")}>
          Add new page
        </Link>
      </div>

      <div className="mt-6">
        <PagesTable pages={pages} />
      </div>
    </div>
  );
}
