"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth-viewer";
import { rateLimit, rateLimitMessage, getClientIpFromHeaders } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const ip = getClientIpFromHeaders();
  const limit = await rateLimit(`login:${ip}`, 10, 15 * 60);
  if (!limit.success) {
    return { error: rateLimitMessage(limit) };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return {};
}
