import { getAdminSession } from "@/lib/auth";
import { listAdmins } from "@/lib/queries/admin-users";
import { AdminUsersManager } from "./AdminUsersManager";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  const admins = await listAdmins();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Admin Users</h1>
      <p className="mt-1 text-sm text-stone">Manage who has access to this admin panel.</p>

      <p className="mt-3 max-w-2xl text-xs text-stone">
        Emails are currently sent from a Resend sandbox address and can only reach test accounts. Verify a custom
        domain in Resend to email real users.
      </p>

      <div className="mt-6">
        <AdminUsersManager initialAdmins={admins} currentAdminId={session?.user?.id ?? ""} />
      </div>
    </div>
  );
}
