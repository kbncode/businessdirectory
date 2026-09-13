import crypto from "crypto";

// The raw token goes in the emailed/logged link; only its hash is stored,
// so a leaked database row can't be used to reset a password.
export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
