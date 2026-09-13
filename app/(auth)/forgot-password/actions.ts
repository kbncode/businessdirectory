"use server";

import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/tokens";
import { rateLimit, rateLimitMessage, getClientIpFromHeaders } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import PasswordReset from "@/emails/PasswordReset";

export type ForgotPasswordState = { message?: string };

const GENERIC_MESSAGE = "If an account exists for that email, a reset link has been sent to it.";
const HONEYPOT_FIELD = "website_url";

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const ip = getClientIpFromHeaders();

  const honeypot = String(formData.get(HONEYPOT_FIELD) || "").trim();
  if (honeypot) {
    console.warn(`Honeypot triggered on forgot-password from IP ${ip}: ${HONEYPOT_FIELD}="${honeypot}"`);
    // Same generic response a real request gets — never reveal the bot was caught.
    return { message: GENERIC_MESSAGE };
  }

  const limit = await rateLimit(`forgot-password:${ip}`, 5, 60 * 60);
  if (!limit.success) {
    return { message: rateLimitMessage(limit) };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) {
    return { message: "Enter your email address." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way whether or not the account exists,
  // so this form can't be used to enumerate registered emails.
  if (user) {
    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await sendEmail(email, "Reset your KBN Business Directory password", PasswordReset({ resetUrl }));
    } catch (emailError) {
      // Matches the pattern everywhere else sendEmail is called: a failed
      // send must never block the action itself, or fail in a way that
      // reveals to the caller whether the account exists.
      console.error(`Failed to send PasswordReset email to ${email}:`, emailError);
    }
  }

  return { message: GENERIC_MESSAGE };
}
