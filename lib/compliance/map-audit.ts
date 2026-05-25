import { complianceControlRefFromId } from "@/lib/compliance/control-ref";
import type { ComplianceControlRef } from "@/lib/compliance/types";

type Rule = {
  prefix?: string;
  exact?: string;
  controls: string[];
};

const RULES: Rule[] = [
  {
    exact: "approval.approved",
    controls: [
      "soc2:CC8.1",
      "soc2:CC5.3",
      "iso:A.8.9",
      "pcidss:12.3.1",
      "hipaa:164.308a4",
      "nist_csf:GV.PO-01",
      "nist_csf:PR.AA-01",
      "cis_v8:4.1",
      "cis_v8:6.1",
      "cmmc_l2:3.1.1",
      "cmmc_l2:3.4.2",
      "gdpr_art32:32-i2",
      "gdpr_art32:32-b2",
    ],
  },
  {
    exact: "approval.denied",
    controls: ["soc2:CC8.1", "soc2:CC5.3", "pcidss:12.3.1", "hipaa:164.308a4"],
  },
  {
    exact: "approval.requested",
    controls: ["soc2:CC8.1", "iso:A.8.9", "pcidss:12.3.1", "hipaa:164.308a4"],
  },
  {
    exact: "automation.dry_run",
    controls: [
      "soc2:CC8.1",
      "iso:A.8.25",
      "pcidss:6.3.1",
      "nist_csf:ID.RA-01",
      "nist_csf:PR.DS-01",
      "cis_v8:7.1",
      "cis_v8:11.2",
      "cmmc_l2:3.11.2",
      "gdpr_art32:32-d1",
    ],
  },
  {
    exact: "automation.remediation_executed",
    controls: [
      "soc2:CC8.1",
      "soc2:CC7.3",
      "iso:A.8.9",
      "pcidss:6.3.1",
      "nist_csf:RS.MA-01",
      "nist_csf:RC.RP-01",
      "cis_v8:11.2",
      "cmmc_l2:3.11.2",
      "gdpr_art32:32-r2",
    ],
  },
  {
    exact: "automation.remediation_blocked",
    controls: [
      "soc2:CC8.1",
      "soc2:CC7.2",
      "iso:A.8.16",
      "pcidss:10.2.1",
      "nist_csf:DE.CM-01",
      "nist_csf:DE.AE-01",
      "cis_v8:8.2",
      "cis_v8:13.2",
      "cmmc_l2:3.13.1",
      "cmmc_l2:3.14.2",
      "gdpr_art32:32-d1",
      "gdpr_art32:32-v2",
    ],
  },
  {
    prefix: "automation.execution_blocked",
    controls: ["soc2:CC8.1", "soc2:CC7.2", "iso:A.8.16", "pcidss:10.2.1", "nist_csf:DE.CM-01"],
  },
  {
    prefix: "incident.",
    controls: [
      "soc2:CC7.3",
      "soc2:CC7.4",
      "iso:A.5.24",
      "pcidss:10.2.1",
      "pcidss:12.3.1",
      "hipaa:164.308a6",
      "hipaa:164.312b",
      "nist_csf:RS.MA-01",
      "nist_csf:RS.AN-01",
      "nist_csf:RC.RP-01",
      "cis_v8:6.3",
      "cis_v8:17.1",
      "cmmc_l2:3.6.1",
      "cmmc_l2:3.6.2",
      "cmmc_l2:3.3.1",
      "gdpr_art32:32-r1",
      "gdpr_art32:32-b1",
    ],
  },
  {
    prefix: "api_key.",
    controls: [
      "soc2:CC6.1",
      "soc2:CC6.6",
      "iso:A.5.15",
      "iso:A.8.2",
      "pcidss:7.2.1",
      "pcidss:8.3.1",
      "hipaa:164.312a1",
      "hipaa:164.312d",
      "nist_csf:PR.AA-01",
      "nist_csf:ID.AM-01",
      "cis_v8:1.1",
      "cis_v8:5.2",
      "cmmc_l2:3.5.2",
      "cmmc_l2:3.1.2",
      "gdpr_art32:32-b2",
      "gdpr_art32:32-a2",
    ],
  },
  {
    prefix: "alert_ingest_token.",
    controls: [
      "soc2:CC6.6",
      "iso:A.5.23",
      "pcidss:1.2.1",
      "pcidss:4.2.1",
      "hipaa:164.312e1",
      "gdpr_art32:32-a2",
    ],
  },
  { prefix: "billing.", controls: ["soc2:CC1.4", "pcidss:12.3.1"] },
  {
    exact: "policy.suggestion_accepted",
    controls: [
      "soc2:CC5.3",
      "soc2:CC1.2",
      "iso:A.8.9",
      "pcidss:12.3.1",
      "nist_csf:GV.PO-01",
      "nist_csf:GV.OC-01",
      "cis_v8:4.1",
      "cmmc_l2:3.4.1",
      "gdpr_art32:32-i1",
    ],
  },
  { exact: "policy.suggestion_rejected", controls: ["soc2:CC5.3", "soc2:CC1.2", "pcidss:12.3.1"] },
  {
    prefix: "governance.access_rule.",
    controls: [
      "soc2:CC6.1",
      "iso:A.5.15",
      "iso:A.8.2",
      "pcidss:7.2.1",
      "pcidss:8.3.1",
      "hipaa:164.312a1",
      "hipaa:164.308a3",
      "cmmc_l2:3.1.1",
      "gdpr_art32:32-b2",
    ],
  },
  {
    exact: "governance.deployment_profile_updated",
    controls: ["soc2:CC6.6", "iso:A.5.23", "iso:A.8.9", "pcidss:2.2.2", "cmmc_l2:3.4.2"],
  },
  {
    exact: "governance.retention_policy_updated",
    controls: [
      "soc2:CC1.2",
      "soc2:CC6.6",
      "iso:A.5.23",
      "pcidss:3.2.1",
      "hipaa:164.312c1",
      "gdpr_art32:32-a1",
    ],
  },
  {
    exact: "governance.legal_hold_set",
    controls: [
      "soc2:CC1.2",
      "soc2:CC7.4",
      "iso:A.5.24",
      "pcidss:10.2.1",
      "hipaa:164.308a6",
      "gdpr_art32:32-b1",
    ],
  },
  {
    exact: "governance.legal_hold_cleared",
    controls: ["soc2:CC7.4", "iso:A.5.24", "pcidss:10.2.1", "hipaa:164.308a6", "gdpr_art32:32-b1"],
  },
  {
    exact: "governance.compliance_exported",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.24", "pcidss:12.3.1", "gdpr_art32:32-d2"],
  },
  {
    exact: "governance.soc2_iso_crosswalk_exported",
    controls: ["soc2:CC5.3", "iso:A.8.9", "soc2:CC6.1", "iso:A.5.15"],
  },
  {
    exact: "governance.assessor_workbook_exported",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.24", "iso:A.8.9"],
  },
  {
    exact: "governance.compliance_digest_delivered",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.24", "iso:A.5.15", "pcidss:12.3.1"],
  },
  {
    exact: "governance.compliance_sla_reminders_sent",
    controls: ["soc2:CC1.2", "soc2:CC5.3", "iso:A.5.15", "iso:A.8.9", "pcidss:12.3.1"],
  },
  {
    exact: "governance.fedramp_poam_exported",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.24", "cmmc_l2:3.6.1", "cmmc_l2:3.11.2"],
  },
  {
    exact: "governance.evidence_freshness_exported",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.24", "iso:A.8.16", "pcidss:10.2.1"],
  },
  {
    exact: "governance.baseline_comparison_exported",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.24", "iso:A.8.9", "pcidss:12.3.1", "cmmc_l2:3.1.1"],
  },
  {
    exact: "governance.compliance_risk_heatmap_exported",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.grc_executive_summary_exported",
    controls: ["soc2:CC1.2", "soc2:CC4.1", "iso:A.5.35", "iso:A.5.36"],
  },
  {
    exact: "governance.grc_calendar_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "pcidss:12.3.1"],
  },
  {
    exact: "governance.control_benchmark_exported",
    controls: ["soc2:CC4.1", "iso:A.5.35", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.policy_drift_exported",
    controls: ["soc2:CC8.1", "iso:A.8.25", "pcidss:6.3.1"],
  },
  {
    exact: "governance.control_graph_exported",
    controls: ["soc2:CC4.1", "iso:A.5.35", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.regulatory_impact_exported",
    controls: ["soc2:CC4.1", "iso:A.5.35", "nist_csf:GV.PO-01", "gdpr_art32:32-d2"],
  },
  {
    exact: "governance.evidence_lineage_exported",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.24", "pcidss:12.3.1"],
  },
  {
    exact: "governance.control_testing_schedules_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "pcidss:12.3.1", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.scope_boundary_exported",
    controls: ["soc2:CC6.6", "nist_csf:ID.AM-01", "iso:A.5.23", "pcidss:12.3.1"],
  },
  {
    exact: "governance.compliance_kpi_trends_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.compliance_posture_score_exported",
    controls: ["soc2:CC1.2", "soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.control_ownership_matrix_exported",
    controls: ["soc2:CC1.2", "soc2:CC1.4", "iso:A.5.15", "nist_csf:GV.RR-02"],
  },
  {
    exact: "governance.compliance_exception_register_exported",
    controls: ["soc2:CC5.3", "soc2:CC8.1", "iso:A.5.36", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.assessor_evidence_request_created",
    controls: ["soc2:CC7.4", "iso:A.5.24", "pcidss:12.3.1", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.assessor_evidence_request_fulfilled",
    controls: ["soc2:CC7.4", "iso:A.5.36", "pcidss:10.2.1"],
  },
  {
    exact: "governance.assessor_evidence_request_cancelled",
    controls: ["soc2:CC1.2", "iso:A.5.36"],
  },
  {
    exact: "governance.assessor_evidence_requests_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.compliance_obligation_ics_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.regulatory_mapping_digest_delivered",
    controls: ["soc2:CC5.3", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.inherited_control_coverage_gaps_exported",
    controls: ["soc2:CC1.2", "iso:A.5.23", "pcidss:12.3.1", "hipaa:164.308b1"],
  },
  {
    exact: "governance.compliance_control_health_scorecard_exported",
    controls: ["soc2:CC1.2", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.compliance_committee_meeting_pack_exported",
    controls: ["soc2:CC1.2", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.attestation_renewal_calendar_exported",
    controls: ["soc2:CC1.2", "iso:A.5.36", "pcidss:12.3.1", "hipaa:164.308b1"],
  },
  {
    exact: "governance.attestation_renewal_nudges_sent",
    controls: ["soc2:CC1.2", "iso:A.5.36", "pcidss:12.3.1", "hipaa:164.308b1"],
  },
  {
    exact: "governance.evidence_request_sla_dashboard_exported",
    controls: ["soc2:CC2.2", "iso:A.5.28", "pcidss:12.3.1", "hipaa:164.308b1"],
  },
  {
    exact: "governance.evidence_request_sla_digest_delivered",
    controls: ["soc2:CC2.2", "iso:A.5.28", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.regulatory_obligation_heatmap_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_crossover_report_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.board_obligation_forecast_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_executive_rollup_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_committee_digest_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_committee_digest_delivered",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_density_alert_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_density_alerts_sent",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_density_trend_history_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.board_obligation_whatif_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.committee_obligation_capacity_budget_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_owner_load_balancing_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.peak_week_staffing_digest_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.peak_week_staffing_digest_delivered",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_staffing_action_tracker_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_staffing_action_accepted",
    controls: ["soc2:CC2.2", "iso:A.5.36", "pcidss:12.3.1", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.obligation_staffing_action_updated",
    controls: ["soc2:CC2.2", "iso:A.5.36", "pcidss:12.3.1", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.staffing_action_overdue_reminders_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.staffing_action_overdue_reminders_sent",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_consolidation_playbook_exported",
    controls: ["soc2:CC4.1", "iso:A.5.36", "nist_csf:GV.OC-01", "pcidss:12.3.1"],
  },
  {
    exact: "governance.obligation_consolidation_play_started",
    controls: ["soc2:CC2.2", "iso:A.5.36", "pcidss:12.3.1", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.obligation_consolidation_play_updated",
    controls: ["soc2:CC2.2", "iso:A.5.36", "pcidss:12.3.1", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.control_testing_evidence_linker_exported",
    controls: ["soc2:CC2.2", "iso:A.5.36", "pcidss:12.3.1", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.control_testing_evidence_linked",
    controls: ["soc2:CC2.2", "iso:A.5.36", "pcidss:12.3.1", "nist_csf:GV.OC-01"],
  },
  {
    exact: "governance.assessor_api_token_created",
    controls: ["soc2:CC1.2", "soc2:CC6.1", "iso:A.5.15", "pcidss:7.2.1"],
  },
  {
    exact: "governance.assessor_api_token_revoked",
    controls: ["soc2:CC6.1", "iso:A.5.15", "pcidss:7.2.1"],
  },
  {
    exact: "governance.assessor_api_accessed",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.24", "iso:A.8.9", "pcidss:12.3.1"],
  },
  {
    exact: "governance.compliance_gap_remediation_started",
    controls: ["soc2:CC4.2", "iso:A.5.36", "nist_csf:ID.IM-01"],
  },
  {
    exact: "governance.compliance_gap_remediation_resolved",
    controls: ["soc2:CC4.2", "iso:A.5.36", "nist_csf:ID.IM-01"],
  },
  {
    exact: "governance.evidence_bundle_created",
    controls: ["soc2:CC1.2", "soc2:CC7.4", "iso:A.5.23", "pcidss:12.3.1", "gdpr_art32:32-d2"],
  },
  {
    exact: "governance.control_attestation_assigned",
    controls: ["soc2:CC1.2", "soc2:CC5.3", "iso:A.5.15", "pcidss:12.3.1"],
  },
  {
    exact: "governance.control_attestation_signed",
    controls: ["soc2:CC5.3", "soc2:CC8.1", "iso:A.8.9", "pcidss:12.3.1"],
  },
  {
    exact: "governance.third_party_vendor_created",
    controls: [
      "soc2:CC1.2",
      "soc2:CC5.3",
      "iso:A.5.23",
      "pcidss:12.3.1",
      "hipaa:164.308b1",
      "cis_v8:12.8",
      "cmmc_l2:3.13.1",
      "gdpr_art32:32-b1",
      "gdpr_art32:32-d2",
    ],
  },
  {
    exact: "governance.third_party_vendor_controls_synced",
    controls: ["soc2:CC5.3", "iso:A.5.23", "iso:A.8.9", "pcidss:12.3.1"],
  },
  { prefix: "slack.", controls: ["soc2:CC7.2", "iso:A.8.16", "pcidss:11.5.1"] },
];

export function complianceControlsForAuditEvent(eventType: string): ComplianceControlRef[] {
  const et = eventType.trim();
  if (!et) return [];

  const ids = new Set<string>();
  for (const rule of RULES) {
    if (rule.exact && et === rule.exact) {
      rule.controls.forEach((c) => ids.add(c));
    }
    if (rule.prefix && et.startsWith(rule.prefix)) {
      rule.controls.forEach((c) => ids.add(c));
    }
  }

  return [...ids].map(complianceControlRefFromId);
}
