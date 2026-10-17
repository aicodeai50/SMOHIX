/** Browser-safe contact constraints and lead status labels. */
export const LEAD_STATUSES = [
  "new",
  "reviewing",
  "contacted",
  "qualified",
  "pilot_proposed",
  "pilot_active",
  "won",
  "closed",
  "spam",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const FIELD_LIMITS = {
  name: 120,
  email: 254,
  company: 200,
  country: 100,
  problem: 5000,
  productContext: 200,
  pilotCategory: 100,
  sourcePath: 500,
} as const;

export const MIN_SUBMIT_MS = 2500;
export const MAX_PAYLOAD_BYTES = 16_384;
