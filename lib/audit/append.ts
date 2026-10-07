import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { captureException, logEvent } from "@/lib/observability/logger";
import { randomUUID } from "node:crypto";
import { deliverAuditRecord } from "@/lib/audit/delivery";

export type AuditAppendInput = {
  event_type: string;
  user_id: string | null;
  org_id?: string | null;
  details?: Record<string, unknown> | null;
};

/** An approval ID can claim one dispatch across both execution entry points. */
export async function claimExecutionAudit(input: AuditAppendInput, requestId: string): Promise<{ ok: boolean; duplicate?: boolean }> {
  try {
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false };
    const { error } = await admin.from("audit_log").insert({ id: requestId, event_type: input.event_type,
      user_id: input.user_id, org_id: input.org_id ?? null, details: input.details ?? null });
    if (error) {
      logEvent("warn", "audit.execution_claim_failed", { record_id: requestId, code: error.code });
      return { ok: false, duplicate: error.code === "23505" };
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Safe, idempotent retries. Critical callers must check the returned delivery result. */
export async function appendAuditEvent(input: AuditAppendInput): Promise<{ ok: boolean }> {
  try {
    const admin = createServiceSupabaseClient();
    if (!admin) {
      if (process.env.NODE_ENV === "production") {
        logEvent("warn", "audit.service_role_missing", { event_type: input.event_type });
      }
      return { ok: false };
    }
    const row = {
      id: randomUUID(),
      event_type: input.event_type,
      user_id: input.user_id,
      org_id: input.org_id ?? null,
      details: input.details ?? null,
    };
    const result = await deliverAuditRecord(() => admin.from("audit_log").insert(row));
    if (!result.ok) logEvent("error", "audit.append_failed", { event_type: input.event_type, record_id: row.id });
    return result;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[audit_log]", e);
    }
    if (process.env.NODE_ENV === "production") {
      await captureException(e, { event: "audit.append_exception", event_type: input.event_type });
    }
    return { ok: false };
  }
}
