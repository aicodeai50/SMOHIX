import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { auditSinceIsoFromWindow, auditWindowToSinceIso } from "@/lib/audit/export-window";
import { buildBaselineComparisonPack, baselineComparisonToCsv } from "@/lib/compliance/baseline-comparison";
import {
  buildComplianceRiskHeatmap,
  riskHeatmapToCsv,
} from "@/lib/compliance/compliance-risk-heatmap";
import {
  buildGrcExecutiveSummary,
  grcExecutiveSummaryToCsv,
  grcExecutiveSummaryToHtml,
  grcExecutiveSummaryToMarkdown,
} from "@/lib/compliance/grc-executive-summary";
import { buildAssessorWorkbookZip } from "@/lib/compliance/assessor-workbook";
import { buildComplianceObligationIcs } from "@/lib/compliance/compliance-obligation-ics";
import type { ResolvedAssessorApiAuth } from "@/lib/compliance/assessor-api-token";
import {
  buildComplianceEvidencePack,
  complianceEvidencePackToCsv,
} from "@/lib/compliance/export";
import {
  buildEvidenceFreshnessDashboard,
  evidenceFreshnessToCsv,
} from "@/lib/compliance/evidence-freshness";
import { buildFedrampPoamPack, fedrampPoamToCsv } from "@/lib/compliance/fedramp-poam";
import { buildComplianceProgramDashboard } from "@/lib/compliance/program-dashboard";
import {
  buildSoc2IsoCrosswalkPack,
  soc2IsoCrosswalkToCsv,
} from "@/lib/compliance/soc2-iso-crosswalk";
import { buildSoc2TypeIIReport } from "@/lib/compliance/type-ii-report";
import { buildIso27001AssessmentReport } from "@/lib/compliance/iso-assessment";
import { buildPciDssAssessmentReport } from "@/lib/compliance/pci-dss-assessment";
import { buildHipaaSecurityAssessmentReport } from "@/lib/compliance/hipaa-assessment";
import { buildNistCsfAlignmentReport } from "@/lib/compliance/nist-csf-assessment";
import { buildCisV8AssessmentReport } from "@/lib/compliance/cis-v8-assessment";
import { buildCmmcL2AssessmentReport } from "@/lib/compliance/cmmc-l2-assessment";
import { buildGdprArt32AssessmentReport } from "@/lib/compliance/gdpr-art32-assessment";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";

export const ASSESSOR_API_RESOURCES = [
  "evidence-export",
  "crosswalk",
  "workbook",
  "baseline-comparison",
  "risk-heatmap",
  "executive-summary",
  "evidence-freshness",
  "fedramp-poam",
  "program",
  "type-ii",
  "iso-assessment",
  "pci-dss",
  "hipaa",
  "nist-csf",
  "cis-v8",
  "cmmc-l2",
  "gdpr-art32",
  "obligation-ics",
] as const;

export type AssessorApiResource = (typeof ASSESSOR_API_RESOURCES)[number];

export function isAssessorApiResource(value: string): value is AssessorApiResource {
  return (ASSESSOR_API_RESOURCES as readonly string[]).includes(value);
}

function parsePeriodDays(req: NextRequest): number {
  const raw = req.nextUrl.searchParams.get("periodDays");
  const parsed = raw ? Number.parseInt(raw, 10) : 30;
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 365 ? parsed : 30;
}

function parseFormat(req: NextRequest): "csv" | "json" {
  const f = req.nextUrl.searchParams.get("format")?.trim().toLowerCase();
  return f === "json" ? "json" : "csv";
}

function parseHorizonDays(req: NextRequest): number {
  const raw =
    req.nextUrl.searchParams.get("horizonDays") ?? req.nextUrl.searchParams.get("periodDays");
  const parsed = raw ? Number.parseInt(raw, 10) : 365;
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 365 ? parsed : 365;
}

async function auditAssessorAccess(
  auth: ResolvedAssessorApiAuth,
  resource: AssessorApiResource,
  details: Record<string, unknown>,
): Promise<void> {
  await appendAuditEvent({
    event_type: "governance.assessor_api_accessed",
    user_id: auth.actorUserId,
    org_id: auth.orgId,
    details: {
      assessor_token_id: auth.tokenId,
      assessor_token_name: auth.tokenName,
      resource,
      ...details,
    },
  });
}

export async function serveAssessorComplianceGet(
  req: NextRequest,
  auth: ResolvedAssessorApiAuth,
  resource: AssessorApiResource,
): Promise<NextResponse> {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const admin = createServiceSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service role unavailable." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const periodDays = parsePeriodDays(req);
  const format = parseFormat(req);
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const shared = {
    orgId: auth.orgId,
    periodDays,
    supabase: admin,
    auditorReadOnly: true,
  };

  if (resource === "evidence-export") {
    const windowNorm = auditWindowToSinceIso(req.nextUrl.searchParams.get("window"));
    const sinceIso = auditSinceIsoFromWindow(windowNorm);
    const pack = await buildComplianceEvidencePack(auth.actorUserId, {
      sinceIso,
      windowLabel: windowNorm,
      orgId: auth.orgId,
      supabase: admin,
    });
    if (!pack) {
      return NextResponse.json({ error: "Could not build evidence export." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, { format, window: windowNorm });
    if (format === "json") {
      return NextResponse.json(pack, {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Disposition": `attachment; filename="compliance-evidence-${stamp}.json"`,
        },
      });
    }
    return new NextResponse(complianceEvidencePackToCsv(pack), {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="compliance-evidence-${stamp}.csv"`,
      },
    });
  }

  if (resource === "crosswalk") {
    const pack = await buildSoc2IsoCrosswalkPack(auth.actorUserId, shared);
    if (!pack) {
      return NextResponse.json({ error: "Could not build crosswalk." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, { format, period_days: periodDays });
    if (format === "json") {
      return NextResponse.json(pack, {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Disposition": `attachment; filename="soc2-iso-crosswalk-${stamp}.json"`,
        },
      });
    }
    return new NextResponse(soc2IsoCrosswalkToCsv(pack), {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="soc2-iso-crosswalk-${stamp}.csv"`,
      },
    });
  }

  if (resource === "workbook") {
    const result = await buildAssessorWorkbookZip(auth.actorUserId, shared);
    if (!result) {
      return NextResponse.json({ error: "Could not build workbook." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, { period_days: periodDays });
    return new NextResponse(new Uint8Array(result.zip), {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  }

  if (resource === "baseline-comparison") {
    const pack = await buildBaselineComparisonPack(auth.actorUserId, shared);
    if (!pack) {
      return NextResponse.json({ error: "Could not build baseline comparison." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, { format, period_days: periodDays });
    if (format === "json") {
      return NextResponse.json(pack, {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Disposition": `attachment; filename="baseline-comparison-${stamp}.json"`,
        },
      });
    }
    return new NextResponse(baselineComparisonToCsv(pack), {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="baseline-comparison-${stamp}.csv"`,
      },
    });
  }

  if (resource === "risk-heatmap") {
    const pack = await buildComplianceRiskHeatmap(auth.actorUserId, shared);
    if (!pack) {
      return NextResponse.json({ error: "Could not build risk heatmap." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, {
      format,
      period_days: periodDays,
      overall_risk_score: pack.overallRiskScore,
    });
    if (format === "json") {
      return NextResponse.json(pack, {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Disposition": `attachment; filename="compliance-risk-heatmap-${stamp}.json"`,
        },
      });
    }
    return new NextResponse(riskHeatmapToCsv(pack), {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="compliance-risk-heatmap-${stamp}.csv"`,
      },
    });
  }

  if (resource === "executive-summary") {
    const summaryFormat = (() => {
      const f = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";
      if (f === "csv") return "csv" as const;
      if (f === "markdown" || f === "md") return "markdown" as const;
      if (f === "html") return "html" as const;
      return "json" as const;
    })();

    const pack = await buildGrcExecutiveSummary(auth.actorUserId, {
      ...shared,
      orgName: null,
    });
    if (!pack) {
      return NextResponse.json({ error: "Could not build executive summary." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, {
      format: summaryFormat,
      period_days: periodDays,
      program_readiness: pack.programReadinessPercent,
    });
    if (summaryFormat === "markdown") {
      return new NextResponse(grcExecutiveSummaryToMarkdown(pack), {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="grc-executive-summary-${stamp}.md"`,
        },
      });
    }
    if (summaryFormat === "html") {
      return new NextResponse(grcExecutiveSummaryToHtml(pack), {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="grc-executive-summary-${stamp}.html"`,
        },
      });
    }
    if (summaryFormat === "json") {
      return NextResponse.json(pack, {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Disposition": `attachment; filename="grc-executive-summary-${stamp}.json"`,
        },
      });
    }
    return new NextResponse(grcExecutiveSummaryToCsv(pack), {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grc-executive-summary-${stamp}.csv"`,
      },
    });
  }

  if (resource === "evidence-freshness") {
    const dashboard = await buildEvidenceFreshnessDashboard(auth.actorUserId, shared);
    if (!dashboard) {
      return NextResponse.json({ error: "Could not build freshness dashboard." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, { format });
    if (format === "json") {
      return NextResponse.json(dashboard, {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Disposition": `attachment; filename="evidence-freshness-${stamp}.json"`,
        },
      });
    }
    return new NextResponse(evidenceFreshnessToCsv(dashboard), {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evidence-freshness-${stamp}.csv"`,
      },
    });
  }

  if (resource === "fedramp-poam") {
    const pack = await buildFedrampPoamPack(auth.actorUserId, shared);
    if (!pack) {
      return NextResponse.json({ error: "Could not build POA&M." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, { format, period_days: periodDays });
    if (format === "json") {
      return NextResponse.json(pack, {
        headers: {
          ...OPERATIONAL_RESPONSE_HEADERS,
          "Content-Disposition": `attachment; filename="fedramp-poam-${stamp}.json"`,
        },
      });
    }
    return new NextResponse(fedrampPoamToCsv(pack), {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fedramp-poam-${stamp}.csv"`,
      },
    });
  }

  if (resource === "program") {
    const dashboard = await buildComplianceProgramDashboard(auth.actorUserId, shared);
    if (!dashboard) {
      return NextResponse.json({ error: "Could not build program dashboard." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, { period_days: periodDays });
    return NextResponse.json(dashboard, {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Disposition": `attachment; filename="program-dashboard-${stamp}.json"`,
      },
    });
  }

  if (resource === "obligation-ics") {
    const horizonDays = parseHorizonDays(req);
    const pack = await buildComplianceObligationIcs(auth.actorUserId, {
      orgId: auth.orgId,
      horizonDays,
      supabase: admin,
    });
    if (!pack) {
      return NextResponse.json({ error: "Could not build obligation ICS." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, {
      horizon_days: horizonDays,
      event_count: pack.eventCount,
    });
    return new NextResponse(pack.ics, {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="smohix-grc-obligations-${stamp}.ics"`,
      },
    });
  }

  const frameworkHandlers: Record<
    Exclude<
      AssessorApiResource,
      | "evidence-export"
      | "crosswalk"
      | "workbook"
      | "baseline-comparison"
      | "risk-heatmap"
      | "executive-summary"
      | "evidence-freshness"
      | "fedramp-poam"
      | "program"
      | "obligation-ics"
    >,
    () => Promise<unknown>
  > = {
    "type-ii": () => buildSoc2TypeIIReport(auth.actorUserId, shared),
    "iso-assessment": () => buildIso27001AssessmentReport(auth.actorUserId, shared),
    "pci-dss": () => buildPciDssAssessmentReport(auth.actorUserId, shared),
    hipaa: () => buildHipaaSecurityAssessmentReport(auth.actorUserId, shared),
    "nist-csf": () => buildNistCsfAlignmentReport(auth.actorUserId, shared),
    "cis-v8": () => buildCisV8AssessmentReport(auth.actorUserId, shared),
    "cmmc-l2": () => buildCmmcL2AssessmentReport(auth.actorUserId, shared),
    "gdpr-art32": () => buildGdprArt32AssessmentReport(auth.actorUserId, shared),
  };

  const handler = frameworkHandlers[resource as keyof typeof frameworkHandlers];
  if (handler) {
    const report = await handler();
    if (!report) {
      return NextResponse.json({ error: "Could not build assessment report." }, { status: 500 });
    }
    await auditAssessorAccess(auth, resource, { period_days: periodDays });
    return NextResponse.json(report, {
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Disposition": `attachment; filename="${resource}-${stamp}.json"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown resource." }, { status: 404 });
}
