/**
 * Contact / lead intake — shared client and server validation.
 * Server persistence: POST /api/contact (service role → contact_leads).
 */

import { SITE_EMAIL_CONTACT } from "@/lib/billing";

export { MIN_SUBMIT_MS, MAX_PAYLOAD_BYTES, FIELD_LIMITS } from "@/lib/contact/leads";

export type InquiryType =
  | "product"
  | "pilot"
  | "enterprise"
  | "developer"
  | "partnership"
  | "healthcare"
  | "media"
  | "careers"
  | "general";

export const INQUIRY_TYPES: readonly {
  value: InquiryType;
  label: string;
}[] = [
  { value: "product", label: "Product question" },
  { value: "pilot", label: "Pilot application" },
  { value: "enterprise", label: "Enterprise" },
  { value: "developer", label: "Developer / API" },
  { value: "partnership", label: "Partnership" },
  { value: "healthcare", label: "Healthcare" },
  { value: "media", label: "Media" },
  { value: "careers", label: "Careers" },
  { value: "general", label: "General" },
] as const;

export const BUDGET_RANGES = [
  { value: "", label: "Prefer not to say" },
  { value: "under-10k", label: "Under $10k" },
  { value: "10k-50k", label: "$10k – $50k" },
  { value: "50k-150k", label: "$50k – $150k" },
  { value: "150k-plus", label: "$150k+" },
] as const;

export const TIMELINE_OPTIONS = [
  { value: "", label: "Not sure yet" },
  { value: "asap", label: "As soon as possible" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "3-6-months", label: "3–6 months" },
  { value: "6-plus-months", label: "6+ months" },
] as const;

export type ContactFormValues = {
  name: string;
  email: string;
  company: string;
  country: string;
  inquiryType: InquiryType;
  problem: string;
  budget: string;
  timeline: string;
  consent: boolean;
  website: string;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (values.website.trim()) {
    errors.website = "Invalid submission.";
    return errors;
  }

  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.email.trim()) {
    errors.email = "Work email is required.";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.company.trim()) errors.company = "Company or organization is required.";
  if (!values.country.trim()) errors.country = "Country is required.";
  if (!values.problem.trim()) {
    errors.problem = "Tell us what problem you are trying to solve.";
  } else if (values.problem.trim().length < 20) {
    errors.problem = "Please provide at least a few sentences (20+ characters).";
  }
  if (!values.consent) errors.consent = "Consent is required to submit.";

  return errors;
}

export function inquiryTypeLabel(type: InquiryType): string {
  return INQUIRY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function buildContactMailto(values: ContactFormValues): string {
  const subject = `[${inquiryTypeLabel(values.inquiryType)}] ${values.company.trim()}`;
  const budgetLabel =
    BUDGET_RANGES.find((b) => b.value === values.budget)?.label ?? values.budget;
  const timelineLabel =
    TIMELINE_OPTIONS.find((t) => t.value === values.timeline)?.label ?? values.timeline;

  const body = [
    `Inquiry type: ${inquiryTypeLabel(values.inquiryType)}`,
    `Name: ${values.name.trim()}`,
    `Email: ${values.email.trim()}`,
    `Company: ${values.company.trim()}`,
    `Country: ${values.country.trim()}`,
    "",
    "Problem / goal:",
    values.problem.trim(),
    "",
    `Budget range: ${budgetLabel || "Not specified"}`,
    `Timeline: ${timelineLabel || "Not specified"}`,
    "",
    "— Sent via zentro.run contact form (mailto fallback)",
  ].join("\n");

  return `mailto:${SITE_EMAIL_CONTACT}?${new URLSearchParams({ subject, body }).toString()}`;
}

export function isInquiryType(value: string | null | undefined): value is InquiryType {
  return INQUIRY_TYPES.some((t) => t.value === value);
}
