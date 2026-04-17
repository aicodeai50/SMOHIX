import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies Lemon Squeezy webhook `X-Signature` (HMAC-SHA256 hex of raw body).
 * @see https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */
export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | null,
  signingSecret: string,
): boolean {
  if (!signatureHeader) {
    return false;
  }
  const expectedHex = createHmac("sha256", signingSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(signatureHeader, "hex");
    if (a.length !== b.length || a.length === 0) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
