"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Honeypot } from "@/components/ui/Honeypot";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-sm bg-signalOrange px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-signalOrange/90 disabled:opacity-60"
    >
      {pending ? "Sending..." : "Send reset link"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPasswordAction, initialState);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Forgot password</h1>
      <p className="mt-2 text-sm text-stone">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <Honeypot />
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

        {state?.message && <p className="text-sm text-stone">{state.message}</p>}

        <SubmitButton />
      </form>

      <p className="mt-4 text-sm text-stone">
        <Link href="/login" className="text-ink underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
