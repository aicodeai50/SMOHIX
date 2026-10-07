/** Public product destination only; safe for browser-facing navigation. */
export const SMOHIX_AI_PUBLIC_URL =
  (process.env.SMOHIX_AI_PUBLIC_URL ?? process.env.ZENTRO_AI_PUBLIC_URL)?.trim() || "https://ai.smohix.run";
