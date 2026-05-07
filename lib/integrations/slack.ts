import { appendAuditEvent } from "@/lib/audit/append";

type SlackPayload = {
  text: string;
};

export type SlackNotificationKind = "approval_decision" | "execution_receipt" | "manual_test";

function slackWebhookUrl(): string | null {
  const value = process.env.ZENTRO_SLACK_WEBHOOK_URL?.trim();
  return value ? value : null;
}

function envEnabled(value: string | undefined, defaultValue = true): boolean {
  const v = value?.trim().toLowerCase();
  if (!v) return defaultValue;
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return defaultValue;
}

export function isSlackWebhookConfigured(): boolean {
  return Boolean(slackWebhookUrl());
}

export function getSlackNotificationConfig(): {
  approvals: boolean;
  executions: boolean;
} {
  return {
    approvals: envEnabled(process.env.ZENTRO_SLACK_NOTIFY_APPROVALS, true),
    executions: envEnabled(process.env.ZENTRO_SLACK_NOTIFY_EXECUTIONS, true),
  };
}

export function shouldSendSlackNotification(kind: SlackNotificationKind): boolean {
  const cfg = getSlackNotificationConfig();
  if (kind === "manual_test") return true;
  if (kind === "approval_decision") return cfg.approvals;
  return cfg.executions;
}

export async function sendSlackNotification(input: {
  title: string;
  body: string;
  details?: string[];
  kind?: SlackNotificationKind;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const url = slackWebhookUrl();
  if (!url) {
    return { ok: false, reason: "slack_not_configured" };
  }
  const kind = input.kind ?? "manual_test";
  if (!shouldSendSlackNotification(kind)) {
    return { ok: false, reason: "slack_disabled_for_event" };
  }

  const lines = [
    `*${input.title}*`,
    input.body,
    ...(input.details?.filter(Boolean).map((d) => `• ${d}`) ?? []),
  ];

  const payload: SlackPayload = {
    text: lines.join("\n"),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { ok: false, reason: `slack_http_${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "slack_send_failed",
    };
  }
}

export async function sendSlackNotificationWithAudit(input: {
  userId: string | null;
  title: string;
  body: string;
  details?: string[];
  kind: SlackNotificationKind;
  auditDetails?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isSlackWebhookConfigured()) {
    await appendAuditEvent({
      event_type: "slack.failed",
      user_id: input.userId,
      details: {
        kind: input.kind,
        reason: "slack_not_configured",
        ...(input.auditDetails ?? {}),
      },
    });
    return { ok: false, reason: "slack_not_configured" };
  }

  if (!shouldSendSlackNotification(input.kind)) {
    await appendAuditEvent({
      event_type: "slack.skipped",
      user_id: input.userId,
      details: {
        kind: input.kind,
        reason: "slack_disabled_for_event",
        ...(input.auditDetails ?? {}),
      },
    });
    return { ok: false, reason: "slack_disabled_for_event" };
  }

  const result = await sendSlackNotification({
    title: input.title,
    body: input.body,
    details: input.details,
    kind: input.kind,
  });

  await appendAuditEvent({
    event_type: result.ok ? "slack.sent" : "slack.failed",
    user_id: input.userId,
    details: {
      kind: input.kind,
      ...(result.ok ? {} : { reason: result.reason }),
      ...(input.auditDetails ?? {}),
    },
  });

  return result;
}
