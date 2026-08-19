/** Canonical Smohix integration HTTP headers (customer-facing / documentation). */
export const SMOHIX_HEADERS = {
  apiKey: "x-smohix-api-key",
  alertSource: "x-smohix-alert-source",
  alertSignature: "x-smohix-signature",
  alertSignatureTimestamp: "x-smohix-signature-timestamp",
  vulnSource: "x-smohix-vuln-source",
  penTestEngagement: "x-smohix-pen-test-engagement",
  manifestSha256: "x-smohix-manifest-sha256",
} as const;

/** Legacy Zentro header names — accepted server-side during compatibility period only. */
export const LEGACY_ZENTRO_HEADERS = {
  apiKey: "x-zentro-api-key",
  alertSource: "x-zentro-alert-source",
  alertSignature: "x-zentro-signature",
  alertSignatureTimestamp: "x-zentro-signature-timestamp",
  vulnSource: "x-zentro-vuln-source",
  penTestEngagement: "x-zentro-pen-test-engagement",
  manifestSha256: "x-zentro-manifest-sha256",
} as const;

export function readSmohixHeader(
  headers: Headers,
  key: keyof typeof SMOHIX_HEADERS,
): string | null {
  return (
    headers.get(SMOHIX_HEADERS[key]) ?? headers.get(LEGACY_ZENTRO_HEADERS[key])
  );
}
