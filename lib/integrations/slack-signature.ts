import { createHmac, timingSafeEqual } from "node:crypto";

type VerifySlackSignatureInput = {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  signingSecret: string;
  nowMs?: number;
};

function safeEqualHex(expectedHex: string, providedHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(providedHex, "hex");
    if (a.length === 0 || a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Verifies Slack request signature:
 * - signature: X-Slack-Signature = v0=<hex>
 * - timestamp: X-Slack-Request-Timestamp
 * - base string: v0:{timestamp}:{rawBody}
 */
export function verifySlackRequestSignature(input: VerifySlackSignatureInput): boolean {
  const signature = input.signatureHeader?.trim();
  const tsRaw = input.timestampHeader?.trim();
  if (!signature || !tsRaw) return false;
  if (!signature.startsWith("v0=")) return false;

  const ts = Number(tsRaw);
  if (!Number.isFinite(ts)) return false;

  const nowSec = Math.floor((input.nowMs ?? Date.now()) / 1000);
  // Replay protection: reject requests older/newer than 5 minutes.
  if (Math.abs(nowSec - ts) > 60 * 5) return false;

  const base = `v0:${tsRaw}:${input.rawBody}`;
  const expectedHex = createHmac("sha256", input.signingSecret).update(base, "utf8").digest("hex");
  const providedHex = signature.slice(3);
  return safeEqualHex(expectedHex, providedHex);
}

