import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  createComplianceAssessorApiToken,
  listComplianceAssessorApiTokens,
} from "@/lib/compliance/assessor-api-token";
import { ASSESSOR_API_RESOURCES } from "@/lib/compliance/assessor-api-serve";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) {
    return NextResponse.json({ error: "No organization." }, { status: 400 });
  }

  const tokens = await listComplianceAssessorApiTokens(orgContext.orgId, supabase);

  return NextResponse.json(
    {
      tokens,
      allowedResources: ASSESSOR_API_RESOURCES,
      apiBasePath: "/api/governance/compliance/assessor",
    },
    { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
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
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let name = "Assessor API token";
  try {
    const body = (await req.json()) as { name?: string };
    if (typeof body.name === "string" && body.name.trim()) {
      name = body.name.trim();
    }
  } catch {
    /* optional body */
  }

  const result = await createComplianceAssessorApiToken(user.id, orgContext.orgId, name, supabase);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await appendAuditEvent({
    event_type: "governance.assessor_api_token_created",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { token_id: result.row.id, name: result.row.name },
  });

  return NextResponse.json(
    {
      token: result.row,
      key: result.plainKey,
      allowedResources: ASSESSOR_API_RESOURCES,
      apiBasePath: "/api/governance/compliance/assessor",
    },
    { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
