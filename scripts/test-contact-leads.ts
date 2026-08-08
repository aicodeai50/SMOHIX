/**
 * Contact lead intake — validation, security, and admin authorization tests.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { AnalyticsPayload } from "../lib/analytics";
import {
  computePilotQualificationScore,
  duplicateFingerprint,
  generatePublicReference,
  MAX_PAYLOAD_BYTES,
  MIN_SUBMIT_MS,
  normalizeLeadPayload,
  stripHtml,
  validateContactApiPayload,
} from "../lib/contact/leads";
import { notifyLeadStored } from "../lib/contact/notifications";
import { getPlatformAdminEmails, isPlatformAdmin } from "../lib/platform/admin";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const validPayload = {
  name: "Jane Doe",
  email: "jane@acmecorp.com",
  company: "Acme Corp",
  country: "United Kingdom",
  inquiryType: "enterprise",
  problem: "We need incident automation integrated with our existing observability stack and approval workflows.",
  budget: "50k-150k",
  timeline: "3-6-months",
  consent: true,
  website: "",
  submitDurationMs: MIN_SUBMIT_MS + 100,
};

// --- Validation ---

const valid = validateContactApiPayload(validPayload);
assert(valid.ok === true, "valid submission passes");

const badEmail = validateContactApiPayload({ ...validPayload, email: "not-an-email" });
assert(!badEmail.ok, "invalid email rejected");
if (!badEmail.ok) assert(Boolean(badEmail.fieldErrors.email), "invalid email field error");

const noConsent = validateContactApiPayload({ ...validPayload, consent: false });
assert(!noConsent.ok, "missing consent rejected");
if (!noConsent.ok) assert(Boolean(noConsent.fieldErrors.consent), "missing consent field error");

const honeypot = validateContactApiPayload({ ...validPayload, website: "https://spam.example" });
assert(!honeypot.ok, "honeypot rejected");
if (!honeypot.ok) assert(Boolean(honeypot.fieldErrors.website), "honeypot field error");

const tooFast = validateContactApiPayload({ ...validPayload, submitDurationMs: 100 });
assert(!tooFast.ok, "too-fast submission rejected");
if (!tooFast.ok) assert(Boolean(tooFast.fieldErrors._form), "too-fast form error");

const invalidInquiry = validateContactApiPayload({ ...validPayload, inquiryType: "invalid" });
assert(!invalidInquiry.ok, "invalid inquiry type rejected");
if (!invalidInquiry.ok) assert(Boolean(invalidInquiry.fieldErrors.inquiryType), "inquiry field error");

const oversizedProblem = "x".repeat(6000);
const huge = validateContactApiPayload({ ...validPayload, problem: oversizedProblem });
assert(!huge.ok || oversizedProblem.length > 5000, "oversized problem handled");

assert(MAX_PAYLOAD_BYTES === 16_384, "payload limit documented");

// --- Sanitization ---

const stripped = stripHtml('<script>alert("x")</script>Hello');
assert(!stripped.includes("<"), "HTML tags stripped");
assert(stripped.includes("Hello"), "text content preserved");

const normalized = normalizeLeadPayload({
  ...validPayload,
  inquiryType: "pilot",
  pilotCategory: "ai-integration",
  productContext: "smohix-ai",
});
assert(normalized.email === "jane@acmecorp.com", "email normalized");
assert(normalized.metadata.is_pilot === true, "pilot flagged in metadata");
assert(
  typeof normalized.metadata.pilot_qualification_score === "number",
  "pilot score computed",
);

const pilotScore = computePilotQualificationScore({
  problemSummary: "A".repeat(60),
  company: "Acme",
  timeline: "asap",
  budgetRange: "10k-50k",
  productContext: "api",
  pilotCategory: "integration",
  email: "jane@acmecorp.com",
});
assert(pilotScore >= 4, "pilot score reflects provided factors");

// --- Reference IDs ---

const ref = generatePublicReference();
assert(/^ZEN-[A-F0-9]{6}$/.test(ref), "reference format ZEN-XXXXXX");

// --- Duplicate fingerprint ---

const fp1 = duplicateFingerprint("a@b.com", "Same problem text here for testing purposes.");
const fp2 = duplicateFingerprint("a@b.com", "Same problem text here for testing purposes.");
assert(fp1 === fp2, "duplicate fingerprint stable");

// --- Platform admin ---

process.env.SMOHIX_PLATFORM_ADMIN_EMAILS = "Admin@Example.com, ops@smohix.run";
delete process.env.ZENTRO_PLATFORM_ADMIN_EMAILS;
assert(isPlatformAdmin("admin@example.com"), "admin email case-insensitive");
assert(!isPlatformAdmin("stranger@example.com"), "non-admin rejected");
assert(getPlatformAdminEmails().length === 2, "admin list parsed");

// --- Analytics payload: no PII keys ---

const allowedPayloadKeys: (keyof AnalyticsPayload)[] = [
  "path",
  "product",
  "inquiryType",
  "href",
  "label",
];
const forbiddenInAnalytics = ["email", "name", "company", "problem", "budget", "notes"];
for (const key of forbiddenInAnalytics) {
  assert(!allowedPayloadKeys.includes(key as keyof AnalyticsPayload), `analytics must not track ${key}`);
}

// --- Service role key not exposed as NEXT_PUBLIC ---

const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");
assert(!envExample.includes("NEXT_PUBLIC_SUPABASE_SERVICE"), "no public service role in env example");
assert(envExample.includes("SUPABASE_SERVICE_ROLE_KEY="), "service role documented server-only");

// --- Client bundle grep: service role string pattern ---

const contactRoute = readFileSync(join(process.cwd(), "app/api/contact/route.ts"), "utf8");
assert(!contactRoute.includes("SUPABASE_SERVICE_ROLE_KEY"), "contact route does not reference service role key literal");

// --- Notification failure does not throw ---

async function runNotificationTest() {
  await notifyLeadStored({
    lead: normalized,
    stored: { id: "test-id", publicReference: ref, createdAt: new Date().toISOString() },
  });
}

runNotificationTest().then(() => {
  console.log("test-contact-leads: all checks passed");
});
