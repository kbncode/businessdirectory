import { Resend } from "resend";
import type { ReactElement } from "react";

const DEFAULT_FROM = "KBN Business Directory <onboarding@resend.dev>";

let client: Resend | null = null;

function getClient() {
  if (!client) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

// Single entry point for every outgoing email. Callers are responsible for
// wrapping this in try/catch — a failed send must never block the action
// that triggered it (submission, approval, rejection all succeed in the
// database regardless of email delivery).
export async function sendEmail(to: string, subject: string, react: ReactElement) {
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const resend = getClient();

  const result = await resend.emails.send({ from, to, subject, react });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  return result.data;
}
