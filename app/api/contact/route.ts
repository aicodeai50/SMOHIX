import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  MAX_PAYLOAD_BYTES,
  normalizeLeadPayload,
  validateContactApiPayload,
} from "@/lib/contact/leads";
import { notifyLeadStored } from "@/lib/contact/notifications";
import { enforceContactRateLimits } from "@/lib/contact/rate-limit";
import {
  findRecentDuplicate,
  insertContactLead,
  isContactStorageConfigured,
} from "@/lib/contact/storage";
import { logEvent } from "@/lib/observability/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const started = Date.now();

  if (!isContactStorageConfigured()) {
    return NextResponse.json(
      {
        success: false,
        code: "STORAGE_UNAVAILABLE",
        message: "Contact intake is temporarily unavailable.",
      },
      { status: 503 },
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    logEvent("warn", "contact_validation_failed", { code: "payload_too_large" });
    return NextResponse.json(
      {
        success: false,
        code: "VALIDATION_ERROR",
        fieldErrors: { _form: "Submission is too large." },
      },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          fieldErrors: { _form: "Submission is too large." },
        },
        { status: 413 },
      );
    }
    body = raw ? JSON.parse(raw) : null;
  } catch {
    logEvent("warn", "contact_validation_failed", { code: "invalid_json" });
    return NextResponse.json(
      {
        success: false,
        code: "VALIDATION_ERROR",
        fieldErrors: { _form: "Invalid submission." },
      },
      { status: 400 },
    );
  }

  logEvent("info", "contact_request_received", {});

  const validated = validateContactApiPayload(body);
  if (!validated.ok) {
    logEvent("warn", "contact_validation_failed", {
      code: "validation_error",
      fields: Object.keys(validated.fieldErrors),
    });
    return NextResponse.json(
      {
        success: false,
        code: "VALIDATION_ERROR",
        fieldErrors: validated.fieldErrors,
      },
      { status: 400 },
    );
  }

  const normalized = normalizeLeadPayload(validated.payload);

  const rateLimit = await enforceContactRateLimits(req, normalized.email);
  if (!rateLimit.ok) {
    logEvent("warn", "contact_rate_limited", {
      inquiryType: normalized.inquiryType,
      retryAfterSec: rateLimit.retryAfterSec,
    });
    return NextResponse.json(
      {
        success: false,
        code: "RATE_LIMITED",
        message: "Too many submissions. Please try again later.",
        retryAfterSec: rateLimit.retryAfterSec,
      },
      { status: 429 },
    );
  }

  const isDuplicate = await findRecentDuplicate(normalized.email, normalized.problemSummary);
  if (isDuplicate) {
    logEvent("warn", "contact_validation_failed", { code: "duplicate" });
    return NextResponse.json(
      {
        success: false,
        code: "DUPLICATE",
        message: "We already received a similar enquiry recently.",
      },
      { status: 409 },
    );
  }

  try {
    const stored = await insertContactLead(normalized);
    logEvent("info", "contact_stored", {
      referenceId: stored.publicReference,
      inquiryType: normalized.inquiryType,
      durationMs: Date.now() - started,
    });

    void notifyLeadStored({ lead: normalized, stored });

    void import("@/lib/revops/activity").then(({ recordLeadActivity }) =>
      recordLeadActivity({
        leadId: stored.id,
        actorEmail: "system@smohix.run",
        eventType: "lead_created",
        summary: `Lead ${stored.publicReference} created`,
        metadata: { inquiryType: normalized.inquiryType },
      }),
    );

    return NextResponse.json(
      {
        success: true,
        referenceId: stored.publicReference,
      },
      { status: 201 },
    );
  } catch (err) {
    const code = err instanceof Error && err.message === "STORAGE_UNAVAILABLE"
      ? "STORAGE_UNAVAILABLE"
      : "STORAGE_FAILED";
    logEvent("error", "contact_stored", { code, durationMs: Date.now() - started });
    return NextResponse.json(
      {
        success: false,
        code,
        message: "Could not save your enquiry. Please try again or email us directly.",
      },
      { status: 503 },
    );
  }
}
