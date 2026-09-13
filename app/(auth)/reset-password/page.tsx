"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-sm bg-signalOrange px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-signalOrange/90 disabled:opacity-60"
    >
      {pending ? "Saving..." : "Set new password"}
    </button>
  );
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, formAction] = useFormState(resetPasswordAction, initialState);

  if (state?.success) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Password updated</h1>
        <p className="mt-2 text-sm text-stone">
          Your password has been reset.{" "}
          <Link href="/login" className="text-ink underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Reset password</h1>
        <p className="mt-2 text-sm text-red-600">
          This link is missing a reset token. Request a new one from the{" "}
          <Link href="/forgot-password" className="text-ink underline">
            forgot password
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Reset password</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange"
          />
          <p className="mt-1 text-xs text-stone">At least 8 characters.</p>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton />
      </form>
    </div>
  );
}
