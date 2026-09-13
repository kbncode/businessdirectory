import { getViewerUsersForAdmin } from "@/lib/queries/viewer-users";
import { UsersTable } from "./UsersTable";

export default async function AdminUsersListPage() {
  const firstPage = await getViewerUsersForAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
      <p className="mt-1 text-sm text-stone">Everyone who has signed up as a viewer/business owner.</p>

      <div className="mt-6">
        <UsersTable initialUsers={firstPage.items} initialCursor={firstPage.nextCursor} />
      </div>
    </div>
  );
}
