import { type ReactNode } from "react";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, required, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-signalOrange"> *</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-stone">{hint}</p>
      ) : null}
    </div>
  );
}

export const fieldInputClass =
  "w-full rounded-sm border border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone focus:outline-none focus:ring-1 focus:ring-signalOrange";
