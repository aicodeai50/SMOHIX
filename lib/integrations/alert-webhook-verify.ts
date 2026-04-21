import { createHmac, timingSafeEqual } from "node:crypto";

type VerifyInput = {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader?: string | null;
  signingSecret: string;
};

function toHexDigest(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

function safeEqualHex(expectedHex: string, providedHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(providedHex, "hex");
    if (a.length !== b.length || a.length === 0) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Optional alert-webhook signature verification.
 * Supports:
 * - `X-Shynvo-Signature: <hex>`
 * - `X-Shynvo-Signature: sha256=<hex>`
 * If `X-Shynvo-Signature-Timestamp` is present, verifies `${timestamp}.${rawBody}` first,
 * then falls back to raw-body HMAC for compatibility.
 */
export function verifyAlertWebhookSignature(input: VerifyInput): boolean {
  const signature = input.signatureHeader?.trim();
  if (!signature) return false;
  const providedHex = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  if (!providedHex) return false;

  const ts = input.timestampHeader?.trim();
  if (ts) {
    const expectedTsHex = toHexDigest(`${ts}.${input.rawBody}`, input.signingSecret);
    if (safeEqualHex(expectedTsHex, providedHex)) {
      return true;
    }
  }

  const expectedRawHex = toHexDigest(input.rawBody, input.signingSecret);
  return safeEqualHex(expectedRawHex, providedHex);
}
