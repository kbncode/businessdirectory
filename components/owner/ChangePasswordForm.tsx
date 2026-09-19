"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";

// Same behavior and API shape as components/admin/ChangePasswordForm.tsx,
// just posting to the viewer's own account endpoint (/api/profile/password
// vs /api/admin/settings/password) — kept as a separate file rather than
// parametrizing the admin one, matching this codebase's convention of
// separate admin/viewer files over shared ones with a mode flag.
const inputClass =
  "mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<AdminToastValue | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword.length < 8) {
      setToast({ message: "New password must be at least 8 characters.", tone: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: "New password and confirmation do not match.", tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to change password.", tone: "error" });
        return;
      }
      setToast({ message: "Password changed.", tone: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setToast({ message: "Failed to change password.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="profile-current-password" className="block text-xs font-medium uppercase tracking-wide text-stone">
            Current password
          </label>
          <input
            id="profile-current-password"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="profile-new-password" className="block text-xs font-medium uppercase tracking-wide text-stone">
            New password
          </label>
          <input
            id="profile-new-password"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="profile-confirm-password" className="block text-xs font-medium uppercase tracking-wide text-stone">
            Confirm new password
          </label>
          <input
            id="profile-confirm-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={cn(buttonClasses("primary"), "self-start disabled:opacity-60")}
        >
          {saving ? "Saving..." : "Change password"}
        </button>
      </form>
    </div>
  );
}
