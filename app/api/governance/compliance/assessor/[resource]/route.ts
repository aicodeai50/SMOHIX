import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { extractAssessorApiKey } from "@/lib/api-keys/resolve";
import { resolveComplianceAssessorApiKey } from "@/lib/compliance/assessor-api-token";
import {
  ASSESSOR_API_RESOURCES,
  isAssessorApiResource,
  serveAssessorComplianceGet,
} from "@/lib/compliance/assessor-api-serve";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only compliance exports for external assessors. Auth: Bearer or X-Smohix-Api-Key with smohix_ca_* token. */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string }> },
) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const { resource: resourceRaw } = await ctx.params;
  const resource = resourceRaw?.trim().toLowerCase() ?? "";

  if (!isAssessorApiResource(resource)) {
    return NextResponse.json(
      {
        error: "unknown_resource",
        allowed: ASSESSOR_API_RESOURCES,
      },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const plain = extractAssessorApiKey(req);
  if (!plain) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Send Authorization: Bearer <smohix_ca_…> or X-Smohix-Api-Key.",
      },
      { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const auth = await resolveComplianceAssessorApiKey(plain);
  if (!auth) {
    return NextResponse.json(
      { error: "invalid_token" },
      { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return serveAssessorComplianceGet(req, auth, resource);
}
