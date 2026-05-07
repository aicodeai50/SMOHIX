import { createHash, randomBytes } from "node:crypto";

/** Plaintext keys shown to the user once; sent as `Authorization: Bearer …` or `X-Zentro-Api-Key`. */
export const API_KEY_PREFIX = "zentro_sk_";

/** Ingest tokens for `POST /api/integrations/alerts` (Bearer). */
export const ALERT_INGEST_PREFIX = "zentro_ingest_";

export function hashApiKeyPlaintext(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

/** Random secret; store only `hashApiKeyPlaintext` in the database. */
export function generateApiKeyPlaintext(): string {
  const suffix = randomBytes(32).toString("base64url");
  return `${API_KEY_PREFIX}${suffix}`;
}

export function generateAlertIngestPlaintext(): string {
  const suffix = randomBytes(32).toString("base64url");
  return `${ALERT_INGEST_PREFIX}${suffix}`;
}

/** Short label for lists (never includes the secret suffix). */
export function displayKeyPrefix(plain: string): string {
  if (!plain.startsWith(API_KEY_PREFIX)) {
    return "zentro_sk_…";
  }
  const rest = plain.slice(API_KEY_PREFIX.length);
  const vis = rest.slice(0, 8);
  return `${API_KEY_PREFIX}${vis}…`;
}

export function displayIngestPrefix(plain: string): string {
  if (!plain.startsWith(ALERT_INGEST_PREFIX)) {
    return "zentro_ingest_…";
  }
  const rest = plain.slice(ALERT_INGEST_PREFIX.length);
  const vis = rest.slice(0, 8);
  return `${ALERT_INGEST_PREFIX}${vis}…`;
}
