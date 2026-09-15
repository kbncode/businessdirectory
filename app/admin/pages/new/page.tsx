import { PageEditor } from "../PageEditor";

export default function AdminNewPagePage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Add new page</h1>

      <div className="mt-6 rounded-sm border border-sand bg-paper p-6">
        <PageEditor mode="create" />
      </div>
    </div>
  );
}
