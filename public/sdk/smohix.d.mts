export class SmohixHttpError extends Error {
  readonly status: number;
  readonly data: unknown;
  constructor(status: number, data: unknown);
}
export interface SmohixClientOptions {
  baseUrl?: string;
  apiKey?: string;
  ingestToken?: string;
  signingSecret?: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}
export class SmohixClient {
  constructor(options?: SmohixClientOptions);
  health(): Promise<unknown>;
  productStatus(): Promise<unknown>;
  reasoningHealth(): Promise<unknown>;
  ingestAlert(alert: Record<string, unknown>): Promise<unknown>;
}

