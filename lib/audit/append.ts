import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { captureException, logEvent } from "@/lib/observability/logger";

export type AuditAppendInput = {
  event_type: string;
  user_id: string | null;
  org_id?: string | null;
  details?: Record<string, unknown> | null;
};

/** Best-effort insert; never throws (webhooks and API routes must not fail on audit). */
export async function appendAuditEvent(input: AuditAppendInput): Promise<void> {
  try {
    const admin = createServiceSupabaseClient();
    if (!admin) {
      if (process.env.NODE_ENV === "production") {
        logEvent("warn", "audit.service_role_missing", { event_type: input.event_type });
      }
      return;
    }
    const { error } = await admin.from("audit_log").insert({
      event_type: input.event_type,
      user_id: input.user_id,
      org_id: input.org_id ?? null,
      details: input.details ?? null,
    });
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[audit_log]", error.message);
    }
    if (error && process.env.NODE_ENV === "production") {
      await captureException(error, { event: "audit.append_failed", event_type: input.event_type });
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[audit_log]", e);
    }
    if (process.env.NODE_ENV === "production") {
      await captureException(e, { event: "audit.append_exception", event_type: input.event_type });
    }
  }
}
