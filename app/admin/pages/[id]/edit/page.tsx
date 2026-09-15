import { notFound } from "next/navigation";
import { getPageForAdmin } from "@/lib/queries/admin-pages";
import { PageEditor } from "../../PageEditor";

export default async function AdminEditPagePage({ params }: { params: { id: string } }) {
  const page = await getPageForAdmin(params.id);
  if (!page) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Edit page</h1>
      <p className="mt-1 text-sm text-stone">{page.title}</p>

      <div className="mt-6 rounded-sm border border-sand bg-paper p-6">
        <PageEditor mode="edit" page={page} />
      </div>
    </div>
  );
}
