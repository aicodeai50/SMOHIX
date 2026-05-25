import type { SupabaseClient } from "@supabase/supabase-js";

import { COMPLIANCE_CONTROLS, getComplianceControl } from "@/lib/compliance/catalog";
import { getComplianceCoverageSummary } from "@/lib/compliance/summary";
import type { ComplianceCoverageRow } from "@/lib/compliance/types";

export type CrosswalkMappingStrength = "primary" | "supporting";

export type Soc2IsoCrosswalkLink = {
  soc2Id: string;
  isoId: string;
  strength: CrosswalkMappingStrength;
  mappingNote: string;
};

/** Curated SOC 2 Trust Services Criteria ↔ ISO 27001:2022 Annex A links for the Zentro catalog subset. */
export const SOC2_ISO_CROSSWALK_LINKS: Soc2IsoCrosswalkLink[] = [
  {
    soc2Id: "soc2:CC1.2",
    isoId: "iso:A.5.15",
    strength: "supporting",
    mappingNote: "Governance oversight supports organizational access control objectives.",
  },
  {
    soc2Id: "soc2:CC1.4",
    isoId: "iso:A.8.25",
    strength: "supporting",
    mappingNote: "Competence and secure SDLC practices reinforce control environment.",
  },
  {
    soc2Id: "soc2:CC5.3",
    isoId: "iso:A.8.9",
    strength: "primary",
    mappingNote: "Documented policies map to configuration management requirements.",
  },
  {
    soc2Id: "soc2:CC6.1",
    isoId: "iso:A.5.15",
    strength: "primary",
    mappingNote: "Logical access security aligns with Annex A access control.",
  },
  {
    soc2Id: "soc2:CC6.1",
    isoId: "iso:A.8.2",
    strength: "supporting",
    mappingNote: "Privileged access rights support logical access criteria.",
  },
  {
    soc2Id: "soc2:CC6.6",
    isoId: "iso:A.5.23",
    strength: "primary",
    mappingNote: "System boundaries and cloud credential management.",
  },
  {
    soc2Id: "soc2:CC6.6",
    isoId: "iso:A.8.9",
    strength: "supporting",
    mappingNote: "Secure configuration of boundary systems.",
  },
  {
    soc2Id: "soc2:CC7.2",
    isoId: "iso:A.8.16",
    strength: "primary",
    mappingNote: "Anomaly and security event monitoring.",
  },
  {
    soc2Id: "soc2:CC7.3",
    isoId: "iso:A.5.24",
    strength: "primary",
    mappingNote: "Security event evaluation and incident management.",
  },
  {
    soc2Id: "soc2:CC7.3",
    isoId: "iso:A.8.16",
    strength: "supporting",
    mappingNote: "Monitoring activities underpin event response.",
  },
  {
    soc2Id: "soc2:CC7.4",
    isoId: "iso:A.5.24",
    strength: "primary",
    mappingNote: "Incident response program maps to ISO incident management.",
  },
  {
    soc2Id: "soc2:CC8.1",
    isoId: "iso:A.8.9",
    strength: "primary",
    mappingNote: "Change authorization aligns with configuration management.",
  },
  {
    soc2Id: "soc2:CC8.1",
    isoId: "iso:A.8.25",
    strength: "supporting",
    mappingNote: "Change control within secure development lifecycle.",
  },
];

export type Soc2IsoCrosswalkMatrixRow = {
  soc2Ref: string;
  soc2Title: string;
  soc2Domain: string;
  isoRef: string;
  isoTitle: string;
  isoDomain: string;
  mappingStrength: CrosswalkMappingStrength;
  mappingNote: string;
  soc2EvidenceStatus: ComplianceCoverageRow["status"];
  isoEvidenceStatus: ComplianceCoverageRow["status"];
  soc2AuditEvents: number;
  isoAuditEvents: number;
  unifiedEvidence: boolean;
};

export type Soc2IsoCrosswalkPack = {
  generatedAt: string;
  periodDays: number;
  sinceIso: string;
  soc2ControlCount: number;
  isoControlCount: number;
  linkCount: number;
  rows: Soc2IsoCrosswalkMatrixRow[];
};

function statusForId(
  rows: ComplianceCoverageRow[],
  id: string,
): { status: ComplianceCoverageRow["status"]; auditEvents: number } {
  const row = rows.find((r) => r.control.id === id);
  return {
    status: row?.status ?? "none",
    auditEvents: row?.auditEvidenceCount ?? 0,
  };
}

export function buildSoc2IsoCrosswalkMatrix(
  coverageRows: ComplianceCoverageRow[],
): Soc2IsoCrosswalkMatrixRow[] {
  const matrix: Soc2IsoCrosswalkMatrixRow[] = [];

  for (const link of SOC2_ISO_CROSSWALK_LINKS) {
    const soc2 = getComplianceControl(link.soc2Id);
    const iso = getComplianceControl(link.isoId);
    if (!soc2 || !iso) continue;

    const soc2Ev = statusForId(coverageRows, link.soc2Id);
    const isoEv = statusForId(coverageRows, link.isoId);
    const unifiedEvidence =
      (soc2Ev.status === "covered" || soc2Ev.status === "partial") &&
      (isoEv.status === "covered" || isoEv.status === "partial");

    matrix.push({
      soc2Ref: soc2.ref,
      soc2Title: soc2.title,
      soc2Domain: soc2.domain,
      isoRef: iso.ref,
      isoTitle: iso.title,
      isoDomain: iso.domain,
      mappingStrength: link.strength,
      mappingNote: link.mappingNote,
      soc2EvidenceStatus: soc2Ev.status,
      isoEvidenceStatus: isoEv.status,
      soc2AuditEvents: soc2Ev.auditEvents,
      isoAuditEvents: isoEv.auditEvents,
      unifiedEvidence,
    });
  }

  return matrix;
}

export async function buildSoc2IsoCrosswalkPack(
  userId: string,
  opts: { periodDays?: number; orgId?: string | null; supabase?: SupabaseClient },
): Promise<Soc2IsoCrosswalkPack | null> {
  if (!userId) return null;

  const periodDays = opts.periodDays ?? 30;
  const sinceIso = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  const summary = await getComplianceCoverageSummary(userId, {
    sinceIso,
    orgId: opts.orgId,
    supabase: opts.supabase,
  });

  const soc2Count = COMPLIANCE_CONTROLS.filter((c) => c.framework === "soc2").length;
  const isoCount = COMPLIANCE_CONTROLS.filter((c) => c.framework === "iso27001").length;
  const rows = buildSoc2IsoCrosswalkMatrix(summary.rows);

  return {
    generatedAt: new Date().toISOString(),
    periodDays,
    sinceIso,
    soc2ControlCount: soc2Count,
    isoControlCount: isoCount,
    linkCount: rows.length,
    rows,
  };
}

export function soc2IsoCrosswalkToCsv(pack: Soc2IsoCrosswalkPack): string {
  const header = [
    "soc2_ref",
    "soc2_title",
    "soc2_domain",
    "iso_ref",
    "iso_title",
    "iso_domain",
    "mapping_strength",
    "mapping_note",
    "soc2_evidence_status",
    "iso_evidence_status",
    "soc2_audit_events",
    "iso_audit_events",
    "unified_evidence",
  ];

  const lines = pack.rows.map((r) =>
    [
      r.soc2Ref,
      r.soc2Title,
      r.soc2Domain,
      r.isoRef,
      r.isoTitle,
      r.isoDomain,
      r.mappingStrength,
      r.mappingNote,
      r.soc2EvidenceStatus,
      r.isoEvidenceStatus,
      String(r.soc2AuditEvents),
      String(r.isoAuditEvents),
      r.unifiedEvidence ? "true" : "false",
    ]
      .map((c) => {
        const s = String(c);
        return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(","),
  );

  return [
    `# Zentro SOC 2 / ISO 27001 crosswalk`,
    `# generated_at: ${pack.generatedAt}`,
    `# period_days: ${pack.periodDays}`,
    `# links: ${pack.linkCount}`,
    header.join(","),
    ...lines,
    "",
  ].join("\n");
}
