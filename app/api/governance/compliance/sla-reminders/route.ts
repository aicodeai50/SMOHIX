import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  collectComplianceSlaReminders,
  getComplianceSlaOrgSettings,
  runComplianceSlaRemindersForOrg,
} from "@/lib/compliance/compliance-sla-reminders";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteOrigin(req: NextRequest): string {
  const env = process.env.ZENTRO_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://zentro.run";
}

/** Preview SLA items (GET) or send reminders (POST) for org admins. */
export async function GET() {
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

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) {
    return NextResponse.json(
      { error: "No organization." },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const settings = await getComplianceSlaOrgSettings(orgContext.orgId, supabase);
  const bundle = await collectComplianceSlaReminders(user.id, orgContext.orgId, {
    dueDaysBefore: settings.dueDaysBefore,
    supabase,
  });

  return NextResponse.json({ settings, bundle }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}

export async function POST(req: NextRequest) {
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

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const result = await runComplianceSlaRemindersForOrg(user.id, orgContext.orgId, {
    siteOrigin: siteOrigin(req),
    supabase,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.compliance_sla_reminders_sent",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      slack_sent: result.slackSent,
      emails_sent: result.emailsSent,
      items_considered: result.itemsConsidered,
      due_soon: result.bundle.dueSoon.length,
      overdue: result.bundle.overdue.length,
      regressed: result.bundle.regressed.length,
    },
  });

  return NextResponse.json(result, { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS });
}
