"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/lib/auth-viewer";
import { rateLimit, rateLimitMessage, getClientIpFromHeaders } from "@/lib/rate-limit";

export type SignupState = { error?: string };

const HONEYPOT_FIELD = "website_url";

export async function signupAction(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const ip = getClientIpFromHeaders();
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");

  const honeypot = String(formData.get(HONEYPOT_FIELD) || "").trim();
  if (honeypot) {
    console.warn(`Honeypot triggered on signup from IP ${ip}: ${HONEYPOT_FIELD}="${honeypot}"`);
    // Fake success — no account is created, but the bot sees the same
    // outcome a real signup would produce.
    redirect(callbackUrl);
  }

  const limit = await rateLimit(`signup:${ip}`, 5, 60 * 60);
  if (!limit.success) {
    return { error: rateLimitMessage(limit) };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();

  if (!email || !password || !name) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { email, name, passwordHash } });

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but automatic sign-in failed. Please log in." };
    }
    throw error;
  }

  return {};
}
