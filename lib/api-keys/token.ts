import { createHash, randomBytes } from "node:crypto";

/** Plaintext keys shown to the user once; sent as `Authorization: Bearer …` or `X-Zentro-Api-Key`. */
export const API_KEY_PREFIX = "zentro_sk_";

/** Read-only compliance assessor keys for `/api/governance/compliance/assessor/*`. */
export const ASSESSOR_API_KEY_PREFIX = "zentro_ca_";

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

export function generateAssessorApiKeyPlaintext(): string {
  const suffix = randomBytes(32).toString("base64url");
  return `${ASSESSOR_API_KEY_PREFIX}${suffix}`;
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

export function displayAssessorKeyPrefix(plain: string): string {
  if (!plain.startsWith(ASSESSOR_API_KEY_PREFIX)) {
    return "zentro_ca_…";
  }
  const rest = plain.slice(ASSESSOR_API_KEY_PREFIX.length);
  const vis = rest.slice(0, 8);
  return `${ASSESSOR_API_KEY_PREFIX}${vis}…`;
}

export function displayIngestPrefix(plain: string): string {
  if (!plain.startsWith(ALERT_INGEST_PREFIX)) {
    return "zentro_ingest_…";
  }
  const rest = plain.slice(ALERT_INGEST_PREFIX.length);
  const vis = rest.slice(0, 8);
  return `${ALERT_INGEST_PREFIX}${vis}…`;
}
