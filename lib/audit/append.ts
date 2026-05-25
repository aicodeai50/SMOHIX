import { createServiceSupabaseClient } from "@/lib/supabase/admin";

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
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[audit_log]", e);
    }
  }
}
