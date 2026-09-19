"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";

const inputClass =
  "mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange";

interface EditUserFormProps {
  user: { id: string; email: string; name: string | null };
  onSaved: (updated: { id: string; name: string | null }) => void;
}

// Deliberately no "current password" field here — unlike the viewer's own
// ChangePasswordForm, an admin resetting someone else's password is
// authorized by their own admin session, not by proving knowledge of the
// old one (they may not even know it, and forcing that would defeat the
// point of an admin-side reset).
export function EditUserForm({ user, onSaved }: EditUserFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword && newPassword.length < 8) {
      setToast({ message: "New password must be at least 8 characters.", tone: "error" });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setToast({ message: "New password and confirmation do not match.", tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, newPassword: newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to save changes.", tone: "error" });
        return;
      }
      setToast({ message: "User updated.", tone: "success" });
      setNewPassword("");
      setConfirmPassword("");
      onSaved(data.user);
    } catch {
      setToast({ message: "Failed to save changes.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-stone">Email</label>
          <p className="mt-1 text-sm text-stone">{user.email}</p>
        </div>

        <div>
          <label htmlFor="edit-user-name" className="block text-xs font-medium uppercase tracking-wide text-stone">
            Name
          </label>
          <input
            id="edit-user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="edit-user-password" className="block text-xs font-medium uppercase tracking-wide text-stone">
            New password
          </label>
          <input
            id="edit-user-password"
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to keep the current password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {newPassword && (
          <div>
            <label htmlFor="edit-user-confirm-password" className="block text-xs font-medium uppercase tracking-wide text-stone">
              Confirm new password
            </label>
            <input
              id="edit-user-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className={cn(buttonClasses("primary"), "self-start disabled:opacity-60")}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
