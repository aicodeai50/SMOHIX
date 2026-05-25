import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { revokeComplianceAssessorApiToken } from "@/lib/compliance/assessor-api-token";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
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

  const { id } = await ctx.params;
  const ok = await revokeComplianceAssessorApiToken(orgContext.orgId, id, supabase);
  if (!ok) {
    return NextResponse.json({ error: "Could not revoke token." }, { status: 400 });
  }

  await appendAuditEvent({
    event_type: "governance.assessor_api_token_revoked",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { token_id: id },
  });

  return NextResponse.json({ ok: true }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}
