"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { adminLoginAction, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-sm bg-signalOrange px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-signalOrange/90 disabled:opacity-60"
    >
      {pending ? "Logging in..." : "Log in"}
    </button>
  );
}

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/pending";
  const [state, formAction] = useFormState(adminLoginAction, initialState);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4">
      <p className="font-body text-xs font-medium uppercase tracking-widest text-signalOrange">Admin</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">KBN Admin Login</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange"
          />
        </div>

        {state?.error && <p className="text-sm text-rejectedRed">{state.error}</p>}

        <SubmitButton />
      </form>
    </div>
  );
}
