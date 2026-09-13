"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

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

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Log in</h1>

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

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton />
      </form>

      <div className="mt-4 flex flex-col gap-2 text-sm text-stone">
        <Link href="/forgot-password" className="text-ink underline">
          Forgot password?
        </Link>
        <p>
          No account?{" "}
          <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-ink underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
