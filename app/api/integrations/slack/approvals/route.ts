import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { verifySlackRequestSignature } from "@/lib/integrations/slack-signature";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";

export const runtime = "nodejs";

type SlackApprovalDecision = "approved" | "denied";

function normalizeDecision(value: string): SlackApprovalDecision | null {
  const v = value.trim().toLowerCase();
  if (v === "approved" || v === "approve") return "approved";
  if (v === "denied" || v === "deny") return "denied";
  return null;
}

type ParsedAction = {
  approvalId: string;
  decision: SlackApprovalDecision;
  actorHint: string | null;
};

function parseFromJsonBody(raw: string): ParsedAction | null {
  try {
    const obj = JSON.parse(raw) as {
      approval_id?: unknown;
      decision?: unknown;
      actor_hint?: unknown;
    };
    const approvalId = typeof obj.approval_id === "string" ? obj.approval_id.trim() : "";
    const decisionRaw = typeof obj.decision === "string" ? obj.decision : "";
    const decision = normalizeDecision(decisionRaw);
    const actorHint = typeof obj.actor_hint === "string" ? obj.actor_hint.trim().slice(0, 200) : null;
    if (!approvalId || !decision) return null;
    return { approvalId, decision, actorHint };
  } catch {
    return null;
  }
}

function parseFromFormEncoded(raw: string): ParsedAction | null {
  const params = new URLSearchParams(raw);
  const payloadRaw = params.get("payload");
  if (payloadRaw) {
    try {
      const payload = JSON.parse(payloadRaw) as {
        actions?: Array<{ action_id?: string; value?: string }>;
        user?: { username?: string; id?: string };
      };
      const action = payload.actions?.[0];
      const actionId = typeof action?.action_id === "string" ? action.action_id : "";
      const value = typeof action?.value === "string" ? action.value : "";
      // Expected value format: "<approval_id>|<approved|denied>"
      const [approvalIdRaw, decisionRaw] = value.split("|");
      const decision = normalizeDecision(decisionRaw ?? actionId);
      const approvalId = (approvalIdRaw ?? "").trim();
      const actorHint = payload.user?.username?.trim() || payload.user?.id?.trim() || null;
      if (!approvalId || !decision) return null;
      return { approvalId, decision, actorHint };
    } catch {
      return null;
    }
  }

  const approvalId = params.get("approval_id")?.trim() ?? "";
  const decision = normalizeDecision(params.get("decision") ?? "");
  const actorHint = params.get("actor_hint")?.trim().slice(0, 200) ?? null;
  if (!approvalId || !decision) return null;
  return { approvalId, decision, actorHint };
}

function parseIncomingAction(req: Request, rawBody: string): ParsedAction | null {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    return parseFromJsonBody(rawBody);
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return parseFromFormEncoded(rawBody);
  }
  return parseFromJsonBody(rawBody) ?? parseFromFormEncoded(rawBody);
}

export async function POST(req: Request) {
  const signingSecret = process.env.SHYNVO_SLACK_SIGNING_SECRET?.trim();
  if (!signingSecret) {
    return NextResponse.json(
      { error: "slack_signing_secret_not_configured" },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const rawBody = await req.text();
  const valid = verifySlackRequestSignature({
    rawBody,
    signatureHeader: req.headers.get("x-slack-signature"),
    timestampHeader: req.headers.get("x-slack-request-timestamp"),
    signingSecret,
  });
  if (!valid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS });
  }

  const parsed = parseIncomingAction(req, rawBody);
  if (!parsed) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS });
  }

  const admin = createServiceSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "supabase_service_role_not_configured" },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const updatedAt = new Date().toISOString();
  const { data, error } = await admin
    .from("approval_requests")
    .update({ status: parsed.decision, updated_at: updatedAt })
    .eq("id", parsed.approvalId)
    .eq("status", "pending")
    .select("id, user_id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "approval_not_pending_or_not_found" },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: parsed.decision === "approved" ? "approval.approved" : "approval.denied",
    user_id: (data.user_id as string | null) ?? null,
    details: {
      approval_id: parsed.approvalId,
      source: "slack",
      actor_hint: parsed.actorHint,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      approval_id: parsed.approvalId,
      decision: parsed.decision,
      source: "slack",
    },
    { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}

