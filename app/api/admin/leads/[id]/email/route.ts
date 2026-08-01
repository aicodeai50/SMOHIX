import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { logEvent } from "@/lib/observability/logger";
import { recordLeadActivity } from "@/lib/revops/activity";
import { getLeadById } from "@/lib/revops/leads";
import {
  buildMailtoLink,
  getEmailTemplate,
  type EmailTemplateId,
} from "@/lib/revops/email-templates";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "@/lib/notifications/email";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const TEMPLATE_IDS: EmailTemplateId[] = [
  "enquiry_received",
  "request_more_info",
  "pilot_discovery_call",
  "pilot_proposal_ready",
  "follow_up_reminder",
  "pilot_accepted",
  "pilot_completed",
];

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const { id } = await context.params;
  const lead = await getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { templateId, send } = body as { templateId?: string; send?: boolean };
  if (!templateId || !TEMPLATE_IDS.includes(templateId as EmailTemplateId)) {
    return NextResponse.json({ error: "invalid_template" }, { status: 400 });
  }

  const template = getEmailTemplate(templateId as EmailTemplateId)!;
  const templateInput = {
    contactName: lead.name,
    company: lead.company,
    referenceId: lead.public_reference,
    followUpDate: lead.follow_up_date?.slice(0, 10),
    senderName: auth.email.split("@")[0],
  };

  const subject = template.subject(templateInput);
  const text = template.body(templateInput);
  const mailto = buildMailtoLink({
    to: lead.email,
    templateId: templateId as EmailTemplateId,
    templateInput,
  });

  if (send === true) {
    if (!isTransactionalEmailConfigured()) {
      return NextResponse.json({
        ok: false,
        code: "email_not_configured",
        mailto,
        subject,
        text,
        message: "Resend is not configured. Use mailto or copy the draft.",
      });
    }

    const result = await sendTransactionalEmail({ to: lead.email, subject, text });
    if (!result.ok) {
      return NextResponse.json({ ok: false, code: result.reason, mailto, subject, text });
    }

    await recordLeadActivity({
      leadId: id,
      actorEmail: auth.email,
      eventType: "email_sent",
      summary: `Email sent: ${template.label}`,
      metadata: { templateId },
    });

    logEvent("info", "lead_email_sent", { leadId: id, templateId });
    return NextResponse.json({ ok: true, sent: true });
  }

  await recordLeadActivity({
    leadId: id,
    actorEmail: auth.email,
    eventType: "email_drafted",
    summary: `Email draft prepared: ${template.label}`,
    metadata: { templateId },
  });

  return NextResponse.json({ ok: true, sent: false, mailto, subject, text });
}
