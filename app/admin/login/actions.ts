"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth-admin";
import { rateLimit, rateLimitMessage, getClientIpFromHeaders } from "@/lib/rate-limit";

export type AdminLoginState = { error?: string };

export async function adminLoginAction(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const ip = getClientIpFromHeaders();
  const limit = await rateLimit(`admin-login:${ip}`, 10, 15 * 60);
  if (!limit.success) {
    return { error: rateLimitMessage(limit) };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/admin/pending");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid admin credentials." };
    }
    throw error;
  }

  return {};
}
