import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { runGuardedRemediation } from "@/lib/automations/remediation";
import { isSloBurnPolicyBlockedReason } from "@/lib/approvals/policy";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  let playbookId = "";
  let approvalNote = "";
  let rollbackPlan = "";
  let incidentId: string | null = null;
  try {
    const body = (await req.json()) as {
      playbookId?: string;
      approvalNote?: string;
      rollbackPlan?: string;
      incidentId?: string;
    };
    playbookId = String(body.playbookId ?? "").trim();
    approvalNote = String(body.approvalNote ?? "").trim();
    rollbackPlan = String(body.rollbackPlan ?? "").trim();
    incidentId = body.incidentId ? String(body.incidentId).trim() : null;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS });
  }
  if (!playbookId || !approvalNote || !rollbackPlan) {
    return NextResponse.json(
      { error: "missing_required_fields" },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const result = await runGuardedRemediation({
    supabase,
    userId: user.id,
    playbookId,
    approvalNote,
    rollbackPlan,
    incidentId,
    triggerSource: incidentId ? "incident" : "manual",
  });

  await appendAuditEvent({
    user_id: user.id,
    event_type: result.ok ? "automation.remediation_executed" : "automation.remediation_blocked",
    details: {
      playbook_id: playbookId,
      remediation_run_id: result.runId,
      blocked_reason: result.blockedReason,
      checks: result.checks,
      ...(incidentId ? { incident_id: incidentId } : {}),
    },
  });
  if (!result.ok && isSloBurnPolicyBlockedReason(result.blockedReason)) {
    await appendAuditEvent({
      user_id: user.id,
      event_type: "automation.execution_blocked_slo",
      details: {
        playbook_id: playbookId,
        remediation_run_id: result.runId,
        blocked_reason: result.blockedReason,
        ...(incidentId ? { incident_id: incidentId } : {}),
      },
    });
  }

  return NextResponse.json(
    { result },
    {
      status: result.ok ? 200 : 403,
      headers: OPERATIONAL_RESPONSE_HEADERS,
    },
  );
}
