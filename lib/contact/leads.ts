import { createHash, randomBytes } from "node:crypto";

import {
  BUDGET_RANGES,
  INQUIRY_TYPES,
  isInquiryType,
  TIMELINE_OPTIONS,
  type ContactFormValues,
  type InquiryType,
} from "@/lib/contact-form";

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

export type ContactApiPayload = ContactFormValues & {
  productContext?: string | null;
  pilotCategory?: string | null;
  sourcePath?: string | null;
  /** Client performance.now() offset ms since form mount */
  submitDurationMs?: number | null;
};

export type NormalizedLead = {
  name: string;
  email: string;
  company: string;
  country: string;
  inquiryType: InquiryType;
  problemSummary: string;
  budgetRange: string | null;
  timeline: string | null;
  productContext: string | null;
  pilotCategory: string | null;
  consent: boolean;
  sourcePath: string | null;
  metadata: Record<string, unknown>;
};

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

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/\0/g, "");
}

export function normalizeText(input: string, maxLen: number): string {
  return stripHtml(input).replace(/\s+/g, " ").trim().slice(0, maxLen);
}

export function normalizeEmail(input: string): string {
  return normalizeText(input, FIELD_LIMITS.email).toLowerCase();
}

export function isWorkEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

export function generatePublicReference(): string {
  const hex = randomBytes(3).toString("hex").toUpperCase();
  return `ZEN-${hex}`;
}

export function hashIdentifier(value: string): string {
  const salt = process.env.ZENTRO_CONTACT_HASH_SALT ?? "zentro-contact-dev";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 16);
}

export function validateContactApiPayload(
  body: unknown,
): { ok: true; payload: ContactApiPayload } | { ok: false; fieldErrors: Record<string, string> } {
  if (!body || typeof body !== "object") {
    return { ok: false, fieldErrors: { _form: "Invalid submission." } };
  }

  const raw = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};

  const website = typeof raw.website === "string" ? raw.website : "";
  if (website.trim()) {
    fieldErrors.website = "Invalid submission.";
    return { ok: false, fieldErrors };
  }

  const inquiryRaw = typeof raw.inquiryType === "string" ? raw.inquiryType : "";
  if (!isInquiryType(inquiryRaw)) {
    fieldErrors.inquiryType = "Select a valid inquiry type.";
  }

  const name = typeof raw.name === "string" ? raw.name : "";
  const email = typeof raw.email === "string" ? raw.email : "";
  const company = typeof raw.company === "string" ? raw.company : "";
  const country = typeof raw.country === "string" ? raw.country : "";
  const problem = typeof raw.problem === "string" ? raw.problem : "";
  const budget = typeof raw.budget === "string" ? raw.budget : "";
  const timeline = typeof raw.timeline === "string" ? raw.timeline : "";
  const consent = raw.consent === true;

  if (!name.trim()) fieldErrors.name = "Name is required.";
  if (!email.trim()) {
    fieldErrors.email = "Work email is required.";
  } else if (!EMAIL_RE.test(normalizeEmail(email))) {
    fieldErrors.email = "Enter a valid work email.";
  }
  if (!company.trim()) fieldErrors.company = "Company or organization is required.";
  if (!country.trim()) fieldErrors.country = "Country is required.";
  if (!problem.trim()) {
    fieldErrors.problem = "Tell us what problem you are trying to solve.";
  } else if (problem.trim().length < 20) {
    fieldErrors.problem = "Please provide at least a few sentences (20+ characters).";
  }
  if (!consent) fieldErrors.consent = "Consent is required to submit.";

  if (budget && !BUDGET_RANGES.some((b) => b.value === budget)) {
    fieldErrors.budget = "Invalid budget range.";
  }
  if (timeline && !TIMELINE_OPTIONS.some((t) => t.value === timeline)) {
    fieldErrors.timeline = "Invalid timeline.";
  }

  const submitDurationMs =
    typeof raw.submitDurationMs === "number" && Number.isFinite(raw.submitDurationMs)
      ? raw.submitDurationMs
      : null;
  if (submitDurationMs !== null && submitDurationMs < MIN_SUBMIT_MS) {
    fieldErrors._form = "Submission received too quickly. Please try again.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    payload: {
      name,
      email,
      company,
      country,
      inquiryType: inquiryRaw as InquiryType,
      problem,
      budget,
      timeline,
      consent,
      website: "",
      productContext: typeof raw.productContext === "string" ? raw.productContext : null,
      pilotCategory: typeof raw.pilotCategory === "string" ? raw.pilotCategory : null,
      sourcePath: typeof raw.sourcePath === "string" ? raw.sourcePath : null,
      submitDurationMs,
    },
  };
}

export function computePilotQualificationScore(input: {
  problemSummary: string;
  company: string;
  timeline: string | null;
  budgetRange: string | null;
  productContext: string | null;
  pilotCategory: string | null;
  email: string;
}): number {
  let score = 0;
  if (input.problemSummary.length >= 50) score += 1;
  if (input.company.length >= 2) score += 1;
  if (input.timeline) score += 1;
  if (input.pilotCategory || input.productContext) score += 1;
  if (isWorkEmail(input.email)) score += 1;
  if (input.budgetRange) score += 1;
  return score;
}

export function normalizeLeadPayload(payload: ContactApiPayload): NormalizedLead {
  const email = normalizeEmail(payload.email);
  const problemSummary = normalizeText(payload.problem, FIELD_LIMITS.problem);
  const budgetRange = payload.budget?.trim() ? payload.budget.trim() : null;
  const timeline = payload.timeline?.trim() ? payload.timeline.trim() : null;
  const productContext = payload.productContext
    ? normalizeText(payload.productContext, FIELD_LIMITS.productContext)
    : null;
  const pilotCategory = payload.pilotCategory
    ? normalizeText(payload.pilotCategory, FIELD_LIMITS.pilotCategory)
    : null;

  const metadata: Record<string, unknown> = {
    inquiry_label: INQUIRY_TYPES.find((t) => t.value === payload.inquiryType)?.label,
  };

  if (payload.inquiryType === "pilot") {
    metadata.pilot_qualification_score = computePilotQualificationScore({
      problemSummary,
      company: normalizeText(payload.company, FIELD_LIMITS.company),
      timeline,
      budgetRange,
      productContext,
      pilotCategory,
      email,
    });
    metadata.is_pilot = true;
  }

  if (payload.inquiryType === "developer") {
    metadata.is_developer_access_request = true;
  }

  return {
    name: normalizeText(payload.name, FIELD_LIMITS.name),
    email,
    company: normalizeText(payload.company, FIELD_LIMITS.company),
    country: normalizeText(payload.country, FIELD_LIMITS.country),
    inquiryType: payload.inquiryType,
    problemSummary,
    budgetRange,
    timeline,
    productContext,
    pilotCategory,
    consent: payload.consent,
    sourcePath: payload.sourcePath
      ? normalizeText(payload.sourcePath, FIELD_LIMITS.sourcePath)
      : null,
    metadata,
  };
}

export function duplicateFingerprint(email: string, problemSummary: string): string {
  const normalized = `${email.toLowerCase()}|${problemSummary.toLowerCase().slice(0, 200)}`;
  return hashIdentifier(normalized);
}
