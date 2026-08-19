import { createHash, randomBytes } from "node:crypto";

import { LEGACY_ZENTRO_HEADERS, SMOHIX_HEADERS } from "@/lib/integrations/smohix-headers";

/** Canonical Smohix API key prefix for newly issued keys. */
export const API_KEY_PREFIX = "smohix_sk_";

/** Legacy prefix — still accepted for validation; never advertised in customer UI. */
export const LEGACY_API_KEY_PREFIX = "zentro_sk_";

/** Read-only compliance assessor keys for `/api/governance/compliance/assessor/*`. */
export const ASSESSOR_API_KEY_PREFIX = "smohix_ca_";

export const LEGACY_ASSESSOR_API_KEY_PREFIX = "zentro_ca_";

/** Ingest tokens for `POST /api/integrations/alerts` (Bearer). */
export const ALERT_INGEST_PREFIX = "smohix_ingest_";

export const LEGACY_ALERT_INGEST_PREFIX = "zentro_ingest_";

export const API_KEY_PREFIXES = [API_KEY_PREFIX, LEGACY_API_KEY_PREFIX] as const;

export const ASSESSOR_API_KEY_PREFIXES = [
  ASSESSOR_API_KEY_PREFIX,
  LEGACY_ASSESSOR_API_KEY_PREFIX,
] as const;

export const ALERT_INGEST_PREFIXES = [ALERT_INGEST_PREFIX, LEGACY_ALERT_INGEST_PREFIX] as const;

/** Preferred API key header for documentation and UI. */
export const API_KEY_HEADER = SMOHIX_HEADERS.apiKey;

/** Legacy API key header — accepted server-side only. */
export const LEGACY_API_KEY_HEADER = LEGACY_ZENTRO_HEADERS.apiKey;

export function isApiKeyPlaintext(plain: string): boolean {
  return API_KEY_PREFIXES.some((prefix) => plain.startsWith(prefix));
}

export function isAssessorKeyPlaintext(plain: string): boolean {
  return ASSESSOR_API_KEY_PREFIXES.some((prefix) => plain.startsWith(prefix));
}

export function isAlertIngestPlaintext(plain: string): boolean {
  return ALERT_INGEST_PREFIXES.some((prefix) => plain.startsWith(prefix));
}

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

function displayPrefix(plain: string, prefixes: readonly string[], fallback: string): string {
  for (const prefix of prefixes) {
    if (plain.startsWith(prefix)) {
      const rest = plain.slice(prefix.length);
      const vis = rest.slice(0, 8);
      return `${prefix}${vis}…`;
    }
  }
  return fallback;
}

/** Short label for lists (never includes the secret suffix). */
export function displayKeyPrefix(plain: string): string {
  return displayPrefix(plain, API_KEY_PREFIXES, `${API_KEY_PREFIX}…`);
}

export function displayAssessorKeyPrefix(plain: string): string {
  return displayPrefix(plain, ASSESSOR_API_KEY_PREFIXES, `${ASSESSOR_API_KEY_PREFIX}…`);
}

export function displayIngestPrefix(plain: string): string {
  return displayPrefix(plain, ALERT_INGEST_PREFIXES, `${ALERT_INGEST_PREFIX}…`);
}
