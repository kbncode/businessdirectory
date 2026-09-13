"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Honeypot } from "@/components/ui/Honeypot";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-sm bg-signalOrange px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-signalOrange/90 disabled:opacity-60"
    >
      {pending ? "Creating account..." : "Sign up"}
    </button>
  );
}

export default function SignupPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [state, formAction] = useFormState(signupAction, initialState);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Sign up</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Honeypot />
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange"
          />
        </div>

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
            minLength={8}
            className="mt-1 w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-signalOrange"
          />
          <p className="mt-1 text-xs text-stone">At least 8 characters.</p>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton />
      </form>

      <p className="mt-4 text-sm text-stone">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
