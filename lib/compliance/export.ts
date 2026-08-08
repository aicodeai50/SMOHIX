import type { SupabaseClient } from "@supabase/supabase-js";

import { applyUserOrOrgScope } from "@/lib/org/apply-scope-query";
import { listAcceptedPolicyGuardrailsByPlaybook } from "@/lib/approvals/policy-suggestions";
import { escapeCsvField } from "@/lib/audit/csv-escape";
import { incidentIdFromAuditDetails } from "@/lib/audit/incident-from-details";
import { complianceControlsForAuditEvent } from "@/lib/compliance/map-audit";
import { complianceControlsForAcceptedPolicy } from "@/lib/compliance/map-policy";
import { getComplianceCoverageSummary } from "@/lib/compliance/summary";
import type { ComplianceSummary } from "@/lib/compliance/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

export type ComplianceEvidenceAuditRow = {
  createdAt: string;
  eventType: string;
  actor: "account" | "system";
  incidentId: string;
  soc2Controls: string[];
  iso27001Controls: string[];
  pciDssControls: string[];
  hipaaControls: string[];
  nistCsfControls: string[];
  cisV8Controls: string[];
  cmmcL2Controls: string[];
  gdprArt32Controls: string[];
  detailsJson: string;
};

export type ComplianceEvidencePack = {
  generatedAt: string;
  windowLabel: string;
  sinceIso: string | null;
  summary: ComplianceSummary;
  auditEvents: ComplianceEvidenceAuditRow[];
  acceptedPolicies: {
    playbookId: string;
    requireDryRunFresh: boolean;
    requireChangeWindow: boolean;
    maxBlastRadius: string | null;
    soc2Controls: string[];
    iso27001Controls: string[];
    pciDssControls: string[];
    hipaaControls: string[];
    nistCsfControls: string[];
    cisV8Controls: string[];
    cmmcL2Controls: string[];
    gdprArt32Controls: string[];
  }[];
};

function detailsJsonForExport(details: Record<string, unknown> | null, maxLen = 4000): string {
  if (!details || typeof details !== "object") return "";
  try {
    const s = JSON.stringify(details);
    return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
  } catch {
    return "";
  }
}

function splitControls(refs: { id: string; framework: string; ref: string }[]): {
  soc2: string[];
  iso: string[];
  pci: string[];
  hipaa: string[];
  nist: string[];
  cis: string[];
  cmmc: string[];
  gdpr: string[];
} {
  const soc2: string[] = [];
  const iso: string[] = [];
  const pci: string[] = [];
  const hipaa: string[] = [];
  const nist: string[] = [];
  const cis: string[] = [];
  const cmmc: string[] = [];
  const gdpr: string[] = [];
  for (const r of refs) {
    if (r.framework === "soc2" || r.id.startsWith("soc2:")) soc2.push(r.ref);
    if (r.framework === "iso27001" || r.id.startsWith("iso:")) iso.push(r.ref);
    if (r.framework === "pcidss" || r.id.startsWith("pcidss:")) pci.push(r.ref);
    if (r.framework === "hipaa" || r.id.startsWith("hipaa:")) hipaa.push(r.ref);
    if (r.framework === "nist_csf" || r.id.startsWith("nist_csf:")) nist.push(r.ref);
    if (r.framework === "cis_v8" || r.id.startsWith("cis_v8:")) cis.push(r.ref);
    if (r.framework === "cmmc_l2" || r.id.startsWith("cmmc_l2:")) cmmc.push(r.ref);
    if (r.framework === "gdpr_art32" || r.id.startsWith("gdpr_art32:")) gdpr.push(r.ref);
  }
  return { soc2, iso, pci, hipaa, nist, cis, cmmc, gdpr };
}

export async function buildComplianceEvidencePack(
  userId: string,
  opts: { sinceIso: string | null; windowLabel: string; orgId?: string | null; supabase?: SupabaseClient },
): Promise<ComplianceEvidencePack | null> {
  if (!hasSupabaseAuth() || !userId) return null;

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const summary = await getComplianceCoverageSummary(userId, {
    sinceIso: opts.sinceIso ?? undefined,
    orgId: opts.orgId,
    supabase,
  });

  let query = supabase
    .from("audit_log")
    .select("created_at, event_type, user_id, details")
    .order("created_at", { ascending: false })
    .limit(500);
  query = applyUserOrOrgScope(query, userId, opts.orgId);
  if (opts.sinceIso) {
    query = query.gte("created_at", opts.sinceIso);
  }
  const { data: auditRows } = await query;

  const auditEvents: ComplianceEvidenceAuditRow[] = (auditRows ?? []).map((row) => {
    const eventType = String(row.event_type);
    const details = (row.details as Record<string, unknown> | null) ?? null;
    const controls = complianceControlsForAuditEvent(eventType);
    const { soc2, iso, pci, hipaa, nist, cis, cmmc, gdpr } = splitControls(controls);
    return {
      createdAt: String(row.created_at),
      eventType,
      actor: row.user_id ? "account" : "system",
      incidentId:
        incidentIdFromAuditDetails(eventType, details) ?? "",
      soc2Controls: soc2,
      iso27001Controls: iso,
      pciDssControls: pci,
      hipaaControls: hipaa,
      nistCsfControls: nist,
      cisV8Controls: cis,
      cmmcL2Controls: cmmc,
      gdprArt32Controls: gdpr,
      detailsJson: detailsJsonForExport(details),
    };
  });

  const accepted = await listAcceptedPolicyGuardrailsByPlaybook(supabase, userId);
  const acceptedPolicies = Object.values(accepted).map((g) => {
    const controls = complianceControlsForAcceptedPolicy(g);
    const { soc2, iso, pci, hipaa, nist, cis, cmmc, gdpr } = splitControls(controls);
    return {
      playbookId: g.playbookId,
      requireDryRunFresh: g.requireDryRunFresh,
      requireChangeWindow: g.requireChangeWindow,
      maxBlastRadius: g.maxBlastRadius,
      soc2Controls: soc2,
      iso27001Controls: iso,
      pciDssControls: pci,
      hipaaControls: hipaa,
      nistCsfControls: nist,
      cisV8Controls: cis,
      cmmcL2Controls: cmmc,
      gdprArt32Controls: gdpr,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    windowLabel: opts.windowLabel,
    sinceIso: opts.sinceIso,
    summary,
    auditEvents,
    acceptedPolicies,
  };
}

export function complianceEvidencePackToCsv(pack: ComplianceEvidencePack): string {
  const headerLines = [
    `# Smohix compliance evidence pack`,
    `# generated_at: ${pack.generatedAt}`,
    `# window: ${pack.windowLabel}`,
    `# coverage_percent: ${pack.summary.coveragePercent}`,
    `# audit_events: ${pack.auditEvents.length}`,
    `# accepted_policies: ${pack.acceptedPolicies.length}`,
  ];

  const tableHeader = [
    "time_utc",
    "event_type",
    "actor",
    "incident_id",
    "soc2_controls",
    "iso27001_controls",
    "pci_dss_controls",
    "hipaa_controls",
    "nist_csf_controls",
    "cis_v8_controls",
    "cmmc_l2_controls",
    "gdpr_art32_controls",
    "details_json",
  ];

  const eventLines = pack.auditEvents.map((r) =>
    [
      r.createdAt,
      r.eventType,
      r.actor,
      r.incidentId,
      r.soc2Controls.join(";"),
      r.iso27001Controls.join(";"),
      (r.pciDssControls ?? []).join(";"),
      (r.hipaaControls ?? []).join(";"),
      (r.nistCsfControls ?? []).join(";"),
      (r.cisV8Controls ?? []).join(";"),
      (r.cmmcL2Controls ?? []).join(";"),
      (r.gdprArt32Controls ?? []).join(";"),
      r.detailsJson,
    ]
      .map((c) => escapeCsvField(c))
      .join(","),
  );

  const policyHeader = [
    "",
    "# accepted_policies",
    "playbook_id,require_dry_run_fresh,require_change_window,max_blast_radius,soc2_controls,iso27001_controls,pci_dss_controls,hipaa_controls,nist_csf_controls,cis_v8_controls,cmmc_l2_controls,gdpr_art32_controls",
  ];
  const policyLines = pack.acceptedPolicies.map((p) =>
    [
      p.playbookId,
      p.requireDryRunFresh ? "true" : "false",
      p.requireChangeWindow ? "true" : "false",
      p.maxBlastRadius ?? "",
      p.soc2Controls.join(";"),
      p.iso27001Controls.join(";"),
      (p.pciDssControls ?? []).join(";"),
      (p.hipaaControls ?? []).join(";"),
      (p.nistCsfControls ?? []).join(";"),
      (p.cisV8Controls ?? []).join(";"),
      (p.cmmcL2Controls ?? []).join(";"),
      (p.gdprArt32Controls ?? []).join(";"),
    ]
      .map((c) => escapeCsvField(c))
      .join(","),
  );

  return [...headerLines, tableHeader.join(","), ...eventLines, ...policyHeader, ...policyLines, ""].join(
    "\n",
  );
}
