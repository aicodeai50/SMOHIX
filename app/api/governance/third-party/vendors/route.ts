import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createThirdPartyVendor,
  listThirdPartyVendors,
} from "@/lib/third-party-risk/data";
import {
  isVendorCategory,
  isVendorRiskTier,
  isVendorStatus,
} from "@/lib/third-party-risk/inheritance";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
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
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) {
    return NextResponse.json(
      { vendors: [] },
      { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const vendors = await listThirdPartyVendors(user.id, orgContext.orgId, supabase);
  return NextResponse.json({ vendors }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
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
  if (isReadOnlyAuditorRole(orgContext.role)) {
    return NextResponse.json(
      { error: "Auditor role is read-only." },
      { status: 403, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON." },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const category = String(body.category ?? "");
  const riskTier = String(body.riskTier ?? "");
  const status = String(body.status ?? "active");

  if (!isVendorCategory(category) || !isVendorRiskTier(riskTier)) {
    return NextResponse.json(
      { error: "Invalid category or risk tier." },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const result = await createThirdPartyVendor(
    user.id,
    orgContext.orgId,
    {
      name: String(body.name ?? ""),
      category,
      riskTier,
      status: isVendorStatus(status) ? status : "active",
      contactEmail: body.contactEmail ? String(body.contactEmail) : null,
      notes: body.notes ? String(body.notes) : null,
    },
    supabase,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json(
    { vendorId: result.vendorId },
    { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
