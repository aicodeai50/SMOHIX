import { appendAuditEvent } from "@/lib/audit/append";

export type TransactionalEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function resendApiKey(): string | null {
  const value = (process.env.SMOHIX_RESEND_API_KEY ?? process.env.ZENTRO_RESEND_API_KEY)?.trim();
  return value ? value : null;
}

function emailFrom(): string | null {
  const value = (process.env.SMOHIX_EMAIL_FROM ?? process.env.ZENTRO_EMAIL_FROM)?.trim();
  return value ? value : null;
}

export function isTransactionalEmailConfigured(): boolean {
  return Boolean(resendApiKey() && emailFrom());
}

export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = resendApiKey();
  const from = emailFrom();
  if (!apiKey || !from) {
    return { ok: false, reason: "email_not_configured" };
  }

  const to = input.to.trim().toLowerCase();
  if (!to.includes("@")) {
    return { ok: false, reason: "invalid_recipient" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? undefined,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, reason: `resend_http_${res.status}:${body.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "email_send_failed",
    };
  }
}

export async function sendTransactionalEmailWithAudit(input: {
  userId: string | null;
  orgId?: string | null;
  to: string;
  subject: string;
  text: string;
  html?: string;
  auditDetails?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isTransactionalEmailConfigured()) {
    await appendAuditEvent({
      event_type: "email.skipped",
      user_id: input.userId,
      org_id: input.orgId ?? null,
      details: {
        reason: "email_not_configured",
        to: input.to.slice(0, 200),
        subject: input.subject.slice(0, 200),
        ...(input.auditDetails ?? {}),
      },
    });
    return { ok: false, reason: "email_not_configured" };
  }

  const result = await sendTransactionalEmail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  await appendAuditEvent({
    event_type: result.ok ? "email.sent" : "email.failed",
    user_id: input.userId,
    org_id: input.orgId ?? null,
    details: {
      to: input.to.slice(0, 200),
      subject: input.subject.slice(0, 200),
      ...(result.ok ? {} : { reason: result.reason }),
      ...(input.auditDetails ?? {}),
    },
  });

  return result;
}
