"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminToast, type AdminToastValue } from "@/components/admin/AdminToast";
import { formatDate } from "@/lib/format";
import type { listAdmins } from "@/lib/queries/admin-users";

type AdminRow = Awaited<ReturnType<typeof listAdmins>>[number];

interface AdminUsersManagerProps {
  initialAdmins: AdminRow[];
  currentAdminId: string;
}

export function AdminUsersManager({ initialAdmins, currentAdminId }: AdminUsersManagerProps) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<AdminToastValue | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ email: string; tempPassword: string } | null>(null);

  const inputClass =
    "rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange";

  async function handleCreate() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setToast({ message: "Enter an email address.", tone: "error" });
      return;
    }

    setCreating(true);
    setNewCredentials(null);
    try {
      const res = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, name: name.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to create admin account.", tone: "error" });
        return;
      }

      setAdmins((prev) => [data.admin, ...prev]);
      setNewCredentials({ email: data.admin.email, tempPassword: data.tempPassword });
      setEmail("");
      setName("");
    } catch {
      setToast({ message: "Failed to create admin account.", tone: "error" });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(admin: AdminRow) {
    if (!window.confirm(`Delete admin account "${admin.email}"?`)) return;

    setBusyId(admin.id);
    try {
      const res = await fetch(`/api/admin/admin-users/${admin.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Failed to delete admin account.", tone: "error" });
        return;
      }
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      setToast({ message: `Deleted "${admin.email}".`, tone: "success" });
    } catch {
      setToast({ message: "Failed to delete admin account.", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && <AdminToast toast={toast} onDismiss={() => setToast(null)} />}

      {newCredentials && (
        <div className="rounded-sm border-l-4 border-signalOrange bg-paper p-4 text-sm text-ink">
          <p className="font-medium">
            Admin account created for <strong>{newCredentials.email}</strong>.
          </p>
          <p className="mt-2">
            Temporary password:{" "}
            <code className="rounded-sm bg-sand px-2 py-1 font-mono text-ink">{newCredentials.tempPassword}</code>
          </p>
          <p className="mt-2 text-xs text-stone">
            Copy this now and relay it to them directly — it will not be shown again after you dismiss this message.
          </p>
          <button
            type="button"
            onClick={() => setNewCredentials(null)}
            className="mt-3 rounded-sm border border-ink px-3 py-1.5 text-xs text-ink hover:bg-sand"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-sm border border-sand bg-paper p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={handleCreate}
          className="rounded-sm bg-signalOrange px-4 py-2 text-sm font-medium text-ink hover:bg-signalOrange/90 disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create admin"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-sand">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-sand text-xs uppercase tracking-wide text-stone">
              <th className="py-2 pl-4 pr-3">Email</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const isSelf = admin.id === currentAdminId;
              return (
                <tr key={admin.id} className="border-t border-sand bg-paper transition-colors hover:bg-sand/40">
                  <td className="py-2 pl-4 pr-3 text-ink">{admin.email}</td>
                  <td className="py-2 pr-3 text-stone">{admin.name ?? "—"}</td>
                  <td className="py-2 pr-3 text-stone">{formatDate(admin.createdAt)}</td>
                  <td className="py-2 pr-4 text-right">
                    {isSelf ? (
                      <span className="text-xs text-stone">This is you</span>
                    ) : (
                      <button
                        type="button"
                        title="Delete admin account"
                        aria-label="Delete admin account"
                        disabled={busyId === admin.id}
                        onClick={() => handleDelete(admin)}
                        className={cn(
                          "rounded-sm p-2 text-rejectedRed transition-colors hover:bg-rejectedRed/10 disabled:opacity-40"
                        )}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
