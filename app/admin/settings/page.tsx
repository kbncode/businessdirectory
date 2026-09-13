import { getAdminSession } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-stone">Signed in as {session?.user?.email}</p>

      <div className="mt-6 rounded-sm border border-sand bg-paper p-5">
        <h2 className="font-display text-base font-bold text-ink">Change password</h2>
        <p className="mt-1 text-sm text-stone">
          Update the password used to sign in to this admin panel.
        </p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
