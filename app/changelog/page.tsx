import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mArticle, mBody, mCard, mH1, mH2 } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Changelog",
  description: `Recent ${SITE_BRAND_NAME} product and marketing updates.`,
};

const ENTRIES: { date: string; title: string; bullets: string[] }[] = [
  {
    date: "Jun 2026",
    title: "Professional brand & SEO overhaul",
    bullets: [
      "Homepage company scale section, use cases, enterprise block, About and Careers pages",
      "Auth and console routes noindexed; sitemap and robots tuned so Google shows the marketing homepage",
      "Richer Organization + SoftwareApplication JSON-LD and unified enterprise metadata copy",
    ],
  },
  {
    date: "May 2026",
    title: "Copilot reliability pass",
    bullets: [
      "Built-in /api/copilot/chat now chains OpenAI → reasoning URL → guided offline (no proxy path required)",
      "Cloud model requires sign-in when Supabase auth is on; thread list surfaces migration and DB errors",
      "Regression: npm run test:copilot-reasoning",
    ],
  },
  {
    date: "May 2026",
    title: "Copilot ambient status layer",
    bullets: [
      "Live health pulse banner on /copilot with assistant mode, connector readiness, and saved-thread counts",
      "Copilot-first phase order — ASSISTANT → CONNECTORS → INCIDENTS → THREADS → GUARDRAILS → APPROVALS",
      "Regression: npm run test:console-ambient-status",
    ],
  },
  {
    date: "May 2026",
    title: "Runbooks ambient status layer",
    bullets: [
      "Live health pulse banner on /runbooks with catalog size, incident linkage coverage, and GRC procedure counts",
      "Runbooks-first phase order — critical/high incidents missing runbooks surface as critical health",
      "Regression: npm run test:console-ambient-status",
    ],
  },
  {
    date: "May 2026",
    title: "Audit ambient status layer",
    bullets: [
      "Live health pulse banner on /audit with trail recency, export readiness, and Slack delivery headlines",
      "Audit-first phase order — append-only posture, whisper event type, and incident cross-signals",
      "Regression: npm run test:console-ambient-status",
    ],
  },
  {
    date: "May 2026",
    title: "Automations ambient status layer",
    bullets: [
      "Live health pulse banner on /automations with dry-run success, guardrail, and connector-context headlines",
      "Automations-first phase order — dry-run stats and approval blockers surfaced in the ambient lattice",
      "Regression: npm run test:console-ambient-status",
    ],
  },
  {
    date: "May 2026",
    title: "Services ambient status layer",
    bullets: [
      "Live health pulse banner on /services with SLO burn, catalog, and connector-context headlines",
      "Services-first phase order — critical/warning error budget counts surfaced in the ambient lattice",
      "Regression: npm run test:console-ambient-status",
    ],
  },
  {
    date: "May 2026",
    title: "Approvals ambient status layer",
    bullets: [
      "Live health pulse banner on /approvals with approval-context headlines and high-risk / policy-gap counts",
      "Approvals-first phase order and session-mode pending queue support in local dev",
      "Regression: npm run test:console-ambient-status",
    ],
  },
  {
    date: "May 2026",
    title: "Incidents ambient status layer",
    bullets: [
      "Live health pulse banner on /incidents with incident-context headlines and hot/open queue counts",
      "Extends console ambient telemetry — same lattice UI as /hub and /overview",
      "Regression: npm run test:console-ambient-status",
    ],
  },
  {
    date: "May 2026",
    title: "Console jump search pinned shortcuts",
    bullets: [
      "Ctrl/Cmd+K idle dropdown lists pinned modules before recently opened routes",
      "Synced from hub personalization (Supabase or local storage in dev mode)",
      "Pin icon on pinned rows in the jump list",
    ],
  },
  {
    date: "May 2026",
    title: "Hub module personalization",
    bullets: [
      "Per-user quick link order and pins on /hub — Customize to reorder, add modules, and pin to nav rail",
      "Pinned modules float to the top of the left console rail when signed in (migration #49: user_console_hub_prefs)",
      "Local mode persists preferences in browser storage; regression: npm run test:hub-personalization",
    ],
  },
  {
    date: "May 2026",
    title: "Console ambient status layer",
    bullets: [
      "Live health pulse on /hub and /overview from incidents, approvals, connectors, and dry-runs",
      "Subtle particle lattice banner with operational / attention / critical states",
      "Regression: npm run test:console-ambient-status",
    ],
  },
  {
    date: "May 2026",
    title: "Staffing digest auto-chain",
    bullets: [
      "Single UTC-week cron: completion rollup → SLA breach digest → committee escalation",
      "Console at /governance/compliance/staffing-digest-auto-chain",
      "POST /api/governance/compliance/staffing-digest-auto-chain/scheduled",
      "Migration #48; audit governance.staffing_digest_auto_chain_run",
    ],
  },
  {
    date: "May 2026",
    title: "Living quantum dimension — marketing",
    bullets: [
      "Canvas particle lattice with singularity field across the homepage",
      "Living pulse status, dimension gates, and breathing command core",
      "Animated living headlines and non-terran operator copy",
    ],
  },
  {
    date: "May 2026",
    title: "Cross-staffing committee escalation",
    bullets: [
      "Escalate SLA-breaching staffing actions after weekly completion rollup email",
      "Email and Slack to committee admins with rollup open-count context",
      "Console at /governance/compliance/cross-staffing-committee-escalation",
      "GET/POST /api/governance/compliance/cross-staffing-committee-escalation",
      "Migration #47; audit governance.cross_staffing_committee_escalation_*",
    ],
  },
  {
    date: "May 2026",
    title: "Futuristic marketing homepage",
    bullets: [
      "Consolidated homepage into neural command hero, bento command surface, and capability orbit",
      "Animated command preview, scrolling ticker, timeline operator flow, and proof rail",
      "Redesigned /next roadmap as horizon bento columns",
    ],
  },
  {
    date: "May 2026",
    title: "Staffing action SLA breach digest",
    bullets: [
      "Weekly digest when open actions exceed configurable days-past-peak completion SLA",
      "Email and Slack to owners and admins with breach queue",
      "Console at /governance/compliance/staffing-sla-breach-digest",
      "GET/POST /api/governance/compliance/staffing-sla-breach-digest",
      "Migration #46; audit governance.staffing_sla_breach_digest_*",
    ],
  },
  {
    date: "May 2026",
    title: "Staffing completion rollup export",
    bullets: [
      "Printable HTML archive with open vs completed staffing actions and completion rate",
      "Weekly email to owners and admins with Save-as-PDF link",
      "Console at /governance/compliance/staffing-completion-rollup",
      "GET/POST /api/governance/compliance/staffing-completion-rollup",
      "Migration #45; audit governance.staffing_completion_rollup_*",
    ],
  },
  {
    date: "May 2026",
    title: "Staffing action overdue reminders",
    bullets: [
      "Email assignees and admins when accepted actions stay open past peak week",
      "Slack digest with deduped reminder log per action and channel",
      "Console at /governance/compliance/staffing-action-reminders",
      "GET/POST /api/governance/compliance/staffing-action-reminders",
      "Migration #44; audit governance.staffing_action_overdue_reminders_*",
    ],
  },
  {
    date: "May 2026",
    title: "Obligation staffing action tracker",
    bullets: [
      "Accept load-balance transfers and capacity what-if relief proposals",
      "Track accepted actions through in progress to completed",
      "Console at /governance/compliance/staffing-actions",
      "GET /api/governance/compliance/staffing-actions",
      "Migration #43; audit governance.obligation_staffing_action_*",
    ],
  },
  {
    date: "May 2026",
    title: "Committee peak-week staffing digest",
    bullets: [
      "Alert when capacity shortfall and load imbalance coincide in forecast peak week",
      "Email, Slack, and optional webhook to owners and admins",
      "Console at /governance/compliance/peak-week-staffing-digest",
      "GET/POST /api/governance/compliance/peak-week-staffing-digest",
      "Migration #42; audit governance.peak_week_staffing_digest_*",
    ],
  },
  {
    date: "May 2026",
    title: "Obligation owner load balancing",
    bullets: [
      "Peak-week obligations mapped to RACI primary accountables per framework",
      "Rebalance suggestions when owner load is uneven across accountables",
      "Console at /governance/compliance/obligation-load-balancing",
      "GET /api/governance/compliance/obligation-load-balancing",
      "Audit governance.obligation_owner_load_balancing_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Committee obligation capacity budget",
    bullets: [
      "Weekly owner-hours from forecast obligations vs committee capacity",
      "Shortfall weeks when estimated hours exceed available owner-hours",
      "Console at /governance/compliance/committee-capacity-budget",
      "GET /api/governance/compliance/committee-capacity-budget",
      "Migration #41; audit governance.committee_obligation_capacity_budget_exported",
    ],
  },
  {
    date: "May 2026",
    title: "Board obligation what-if scenarios",
    bullets: [
      "Stress-test forecast when obligations shift by N weeks or frameworks are descoped",
      "Peak week, current-week, and density breach deltas vs live baseline",
      "Console at /governance/compliance/obligation-whatif",
      "GET /api/governance/compliance/obligation-whatif",
      "Audit governance.board_obligation_whatif_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Obligation density trend history",
    bullets: [
      "Trailing-quarter weekly obligation counts by due week plus alert delivery trend",
      "Forward forecast weeks overlaid for capacity planning",
      "Console at /governance/compliance/obligation-density-trend-history",
      "GET /api/governance/compliance/obligation-density-trend-history",
      "Audit governance.obligation_density_trend_history_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance obligation density alerting",
    bullets: [
      "Org thresholds for current week, peak week, and overdue obligation spikes",
      "Slack and email to owners/admins with per-breach dedup delivery log",
      "Console at /governance/compliance/obligation-density-alerts",
      "GET/POST /api/governance/compliance/obligation-density-alerts",
      "Migration #40; audit governance.obligation_density_alert_*",
    ],
  },
  {
    date: "May 2026",
    title: "Obligation executive rollup PDF",
    bullets: [
      "Printable HTML board packet combining forecast, crossover, consolidation, and SLA",
      "Download HTML and Print → Save as PDF for distribution",
      "Console at /governance/compliance/obligation-rollup",
      "GET /api/governance/compliance/obligation-rollup?format=html",
      "Audit governance.obligation_executive_rollup_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Quarterly obligation committee digest",
    bullets: [
      "Email digest for owners/admins with forecast peaks, crossover clusters, and SLA breaches",
      "90-day cadence with delivery log and optional HTTPS webhook",
      "Console at /governance/compliance/committee-digest",
      "GET/POST /api/governance/compliance/committee-digest",
      "Migration #39; audit governance.obligation_committee_digest_*",
    ],
  },
  {
    date: "May 2026",
    title: "Board obligation forecast timeline",
    bullets: [
      "Weekly forward-looking obligation density from live calendar and requests",
      "Peak week, committee summary, and milestone queue for leadership prep",
      "Console at /governance/compliance/obligation-forecast",
      "GET /api/governance/compliance/obligation-forecast",
      "Audit governance.board_obligation_forecast_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Obligation consolidation playbook",
    bullets: [
      "Six-step operator workflow per crossover cluster with evidence sprint runbook",
      "Track planned → in progress → collected → verified in consolidation plays",
      "Console at /governance/compliance/obligation-consolidation",
      "GET /api/governance/compliance/obligation-consolidation",
      "Migration #38; audit governance.obligation_consolidation_*",
    ],
  },
  {
    date: "May 2026",
    title: "Multi-framework obligation crossover report",
    bullets: [
      "Clusters obligations sharing SOC 2 ↔ ISO crosswalk and thematic control links",
      "Framework pair rollup and evidence reuse notes for aligned due windows",
      "Console at /governance/compliance/obligation-crossover",
      "GET /api/governance/compliance/obligation-crossover",
      "Audit governance.obligation_crossover_report_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Regulatory obligation heatmap",
    bullets: [
      "Framework, vendor tier, and testing-schedule concentration from live calendar and requests",
      "Overdue and due-soon urgency bands with CSV/JSON export",
      "Console at /governance/compliance/obligation-heatmap",
      "GET /api/governance/compliance/obligation-heatmap",
      "Audit governance.regulatory_obligation_heatmap_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Control testing evidence linker",
    bullets: [
      "Maps automation dry-runs to controls and evidence bundle windows",
      "Schedule coverage rollup and assessor workbook testing/ appendix",
      "Console at /governance/compliance/testing-evidence-linker",
      "GET/POST /api/governance/compliance/testing-evidence-linker",
      "Audit governance.control_testing_evidence_*; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance evidence request SLA dashboard",
    bullets: [
      "Overdue and at-risk queues with fulfillment and on-time SLA metrics",
      "Assignee and framework rollups plus auditor digest email/webhook",
      "Console at /governance/compliance/evidence-request-sla",
      "GET/POST /api/governance/compliance/evidence-request-sla",
      "Migration #37; audit governance.evidence_request_sla_*",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance attestation renewal calendar",
    bullets: [
      "Renewal waves with 14-day lead windows across all framework attestations",
      "Per-framework rollup and owner email nudges with weekly dedup",
      "Console at /governance/compliance/attestation-renewal",
      "GET/POST /api/governance/compliance/attestation-renewal",
      "Migration #36; audit governance.attestation_renewal_*",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance committee meeting pack",
    bullets: [
      "ZIP bundle for quarterly committee reviews with printable HTML summary",
      "Includes health scorecard, posture, exception register, and open gap queue",
      "Console at /governance/compliance/committee-meeting-pack",
      "GET /api/governance/compliance/committee-meeting-pack",
      "Audit governance.compliance_committee_meeting_pack_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance control health scorecard",
    bullets: [
      "Leadership health score blending posture, vendor inherited controls, and gap closure",
      "RAG metric table and board-ready leadership actions",
      "Console at /governance/compliance/control-health-scorecard",
      "GET /api/governance/compliance/control-health-scorecard",
      "Audit governance.compliance_control_health_scorecard_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Inherited control coverage gap report",
    bullets: [
      "Vendor-level gaps for inherited controls missing audit evidence or attestation by tier",
      "Tier readiness floors and CSV/JSON export",
      "Console at /governance/compliance/inherited-control-gaps",
      "GET /api/governance/compliance/inherited-control-gaps",
      "Audit governance.inherited_control_coverage_gaps_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Regulatory mapping change digest",
    bullets: [
      "Webhook and email when compliance catalog controls or SOC 2 ↔ ISO crosswalk mappings change",
      "Fingerprint snapshots per org with delivery log at /governance/compliance/mapping-digest",
      "GET/POST /api/governance/compliance/mapping-digest",
      "Migration #35 compliance_mapping_digest_deliveries",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance obligation ICS export",
    bullets: [
      "iCalendar feed of attestation, vendor review, bundle, checkpoint, and evidence-request deadlines",
      "Import into Google Calendar, Outlook, or Apple Calendar",
      "Console at /governance/compliance/obligation-ics",
      "GET /api/governance/compliance/obligation-ics and assessor API obligation-ics resource",
      "Audit governance.compliance_obligation_ics_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Assessor evidence request workflow",
    bullets: [
      "Auditors open document requests per control with due dates, assignees, and fulfillment tracking",
      "Console at /governance/compliance/evidence-requests",
      "GET /api/governance/compliance/evidence-requests",
      "Migration #34 compliance_assessor_evidence_requests; audit assessor_evidence_request_* events",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance exception register",
    bullets: [
      "Central register of control gaps, policy drift, and dismissed compensating remediations",
      "Expiry, approver, and framework linkage from live assessments and attestations",
      "Console at /governance/compliance/exception-register",
      "GET /api/governance/compliance/exception-register",
      "Audit governance.compliance_exception_register_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "GRC control ownership matrix",
    bullets: [
      "RACI matrix per control — accountable from attestations, responsible from in-scope services and vendors",
      "Policy reviewers and workspace roles as consulted / informed; linked to scope boundary mapper",
      "Console at /governance/compliance/control-ownership",
      "GET /api/governance/compliance/control-ownership",
      "Audit governance.control_ownership_matrix_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Unified compliance posture score",
    bullets: [
      "Single 0–100 org-wide score with grade A–F from readiness, attestations, vendors, gaps, and risk pillars",
      "Live pillar breakdown and improvement drivers at /governance/compliance/posture-score",
      "GET /api/governance/compliance/posture-score",
      "Audit governance.compliance_posture_score_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance KPI trend dashboards",
    bullets: [
      "Weekly gap started/resolved and attestation signed activity from audit_log and remediation tables",
      "Per-framework readiness sparklines with measured prior vs current baselines",
      "Console at /governance/compliance/kpi-trends; GET /api/governance/compliance/kpi-trends",
      "Audit governance.compliance_kpi_trends_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance scope boundary mapper",
    bullets: [
      "Maps services, vulnerability assets, vendors, and dependency data flows to framework control packs",
      "In-scope vs out-of-scope zones with per-framework coverage at /governance/compliance/scope-boundary",
      "GET /api/governance/compliance/scope-boundary; JSON or CSV export",
      "Audit governance.scope_boundary_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Automated control testing schedules",
    bullets: [
      "Recurring evidence windows from attestation due dates, quarterly framework checkpoints, stale-control retests, and bundle cadence",
      "Overdue / due / upcoming schedule board at /governance/compliance/testing-schedules",
      "GET /api/governance/compliance/testing-schedules?horizonDays=90",
      "Audit governance.control_testing_schedules_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance evidence lineage tracking",
    bullets: [
      "Six-stage pipeline from audit log and accepted policies through evidence bundles to assessor workbook",
      "Per-control trails with audit event types, playbooks, and bundle linkage at /governance/compliance/evidence-lineage",
      "GET /api/governance/compliance/evidence-lineage; JSON or CSV export",
      "Audit governance.evidence_lineage_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Regulatory change impact simulator",
    bullets: [
      "Five curated regulatory scenarios with projected readiness deltas vs live org baseline",
      "Per-control current vs simulated status and framework rollups at /governance/compliance/regulatory-impact",
      "GET /api/governance/compliance/regulatory-impact; catalog 2026.05-regulatory-v1",
      "Audit governance.regulatory_impact_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Cross-framework control dependency graph",
    bullets: [
      "Links controls via SOC 2↔ISO crosswalk, thematic bridges, shared audit events, and accepted policy mappings",
      "Hub controls, framework pair density, and weighted edge table at /governance/compliance/control-graph",
      "GET /api/governance/compliance/control-graph; JSON or CSV export",
      "Audit governance.control_graph_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance policy drift detection",
    bullets: [
      "Flags accepted automation policies whose guardrails diverge from live continuous assessment gaps",
      "Detects missing dry-run, change-window, blast-radius enforcement and uncovered control gaps",
      "Console at /governance/compliance/policy-drift; GET /api/governance/compliance/policy-drift",
      "Audit governance.policy_drift_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Continuous control benchmarking",
    bullets: [
      "Compare live org readiness to anonymized industry p25–p90 reference cohorts per framework",
      "Estimated peer percentile, delta vs median, and distribution bars at /governance/compliance/benchmarking",
      "GET /api/governance/compliance/benchmarking; catalog 2026.05-industry-v1",
      "Audit governance.control_benchmark_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance calendar & audit season planner",
    bullets: [
      "Month-grid GRC calendar from live attestations, vendor review dates, evidence bundles, and framework quarter checkpoints",
      "Scheduled digest and SLA cadence when org webhooks/settings are configured",
      "Console at /governance/compliance/calendar; GET /api/governance/compliance/calendar",
      "Audit governance.grc_calendar_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Board-ready GRC executive summary",
    bullets: [
      "One-page leadership rollup from live program dashboard, risk heatmap, and attestation posture",
      "Console at /governance/compliance/executive-summary with print and export (HTML, Markdown, JSON, CSV)",
      "GET /api/governance/compliance/executive-summary; assessor API resource executive-summary",
      "Audit governance.grc_executive_summary_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance risk heatmap",
    bullets: [
      "Framework and vendor risk concentration from live baseline comparison, program dashboard, and third-party register",
      "Console at /governance/compliance/risk-heatmap; GET /api/governance/compliance/risk-heatmap (CSV/JSON)",
      "Tier × category vendor matrix, top hotspots, and assessor API resource risk-heatmap",
      "Audit governance.compliance_risk_heatmap_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance automation runbooks",
    bullets: [
      "Link live framework assessment gaps to in-repo runbooks and guarded automation playbooks",
      "Console at /governance/compliance/runbooks; GET /api/governance/compliance/gap-remediations",
      "Program dashboard shows open remediations; audit gap_remediation_started / _resolved",
      "Migration #33 — compliance_gap_remediations; shared ComplianceHubLinks on compliance pages",
    ],
  },
  {
    date: "May 2026",
    title: "Assessor-scoped compliance API tokens",
    bullets: [
      "Org-scoped zentro_ca_* read-only tokens for external auditors",
      "GET /api/governance/compliance/assessor/{resource} — live evidence, workbook, crosswalk, and framework exports",
      "Token management at /governance/compliance/assessor-api; requires SUPABASE_SERVICE_ROLE_KEY to resolve",
      "Migration #32 — compliance_assessor_api_tokens; audit assessor_api_token_* and assessor_api_accessed",
    ],
  },
  {
    date: "May 2026",
    title: "Multi-framework baseline comparison",
    bullets: [
      "Side-by-side readiness and 30d vs prior-30d deltas for all eight framework packs from live org audit and policy data",
      "Console at /governance/compliance/baseline-comparison; GET /api/governance/compliance/baseline-comparison",
      "Highlights lowest readiness and most control regressions; CSV/JSON export",
      "Audit governance.baseline_comparison_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Control evidence freshness dashboard",
    bullets: [
      "Per-control last audit and policy evidence timestamps with fresh / aging / stale bands",
      "Stale control queue and framework rollup at /governance/compliance/evidence-freshness",
      "GET /api/governance/compliance/evidence-freshness — CSV or JSON export",
      "Audit governance.evidence_freshness_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "FedRAMP POA&M export pack",
    bullets: [
      "POA&M CSV/JSON from SOC 2, ISO 27001, and CMMC L2 continuous assessment exceptions",
      "Curated catalog → NIST SP 800-53 Rev 5 crosswalk with risk rating and scheduled completion dates",
      "Console at /governance/compliance/fedramp-poam; GET /api/governance/compliance/fedramp-poam",
      "Includes org deployment tier/region/boundary metadata; audit governance.fedramp_poam_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance control SLA reminders",
    bullets: [
      "Slack summary and Resend email nudges for attestations due soon, overdue, and SOC 2 / ISO readiness regression",
      "Console at /governance/compliance/sla-reminders; GET/POST /api/governance/compliance/sla-reminders",
      "Weekly dedup log; cron POST .../sla-reminders/scheduled with ZENTRO_SLA_CRON_SECRET",
      "Migration #31 — org SLA settings + compliance_sla_reminder_log; audit governance.compliance_sla_reminders_sent",
    ],
  },
  {
    date: "May 2026",
    title: "Scheduled compliance digest webhooks",
    bullets: [
      "Weekly HTTPS digest of program readiness deltas, SOC 2 trend changes, and newly overdue attestations",
      "Console at /governance/compliance/digest; POST /api/governance/compliance/digest and scheduled cron route",
      "Org compliance_digest_webhook_url; delivery history in compliance_digest_deliveries",
      "Migration #30 — audit event governance.compliance_digest_delivered",
    ],
  },
  {
    date: "May 2026",
    title: "Unified assessor workbook export",
    bullets: [
      "ZIP download bundles evidence pack, SOC 2/ISO crosswalk, and framework assessment JSON",
      "Tamper-evident manifest.json with per-file SHA-256 inside the archive",
      "Console at /governance/compliance/workbook; GET /api/governance/compliance/workbook",
      "Depends on jszip — audit event governance.assessor_workbook_exported; no migration",
    ],
  },
  {
    date: "May 2026",
    title: "SOC 2 / ISO 27001 crosswalk export",
    bullets: [
      "Curated mapping matrix linking catalog SOC 2 criteria to ISO 27001:2022 Annex A controls",
      "30-day audit evidence overlay per side with unified-evidence indicator",
      "Console at /governance/compliance/crosswalk; GET /api/governance/compliance/crosswalk (CSV or JSON)",
      "Audit event governance.soc2_iso_crosswalk_exported on download — no migration",
    ],
  },
  {
    date: "May 2026",
    title: "GDPR Article 32 technical measures",
    bullets: [
      "Twelve Article 32(1) security-of-processing measures across encryption, CIA, resilience, and assurance domains",
      "DPA-oriented readiness bands (DPA-ready through At risk) from shared audit and policy evidence",
      "Console at /governance/compliance/gdpr-art32; GET /api/governance/compliance/gdpr-art32",
      "Program dashboard and evidence export add gdpr_art32_controls — no migration",
    ],
  },
  {
    date: "May 2026",
    title: "CMMC 2.0 Level 2 control overlay",
    bullets: [
      "Twelve NIST SP 800-171 Rev 2 practices across AC, AU, CM, IA, IR, RA, SC, and SI families",
      "SPRS-style estimated score (0–110) and practice family readiness from shared audit evidence",
      "Console at /governance/compliance/cmmc-l2; GET /api/governance/compliance/cmmc-l2",
      "Program dashboard and evidence export add cmmc_l2_controls — no migration",
    ],
  },
  {
    date: "May 2026",
    title: "CIS Controls v8 safeguard pack",
    bullets: [
      "Twelve CIS v8 safeguards across Implementation Groups IG1, IG2, and IG3",
      "IG readiness scoring and attained posture from shared audit and policy evidence",
      "Console at /governance/compliance/cis-v8; GET /api/governance/compliance/cis-v8",
      "Program dashboard and evidence export add cis_v8_controls — no migration",
    ],
  },
  {
    date: "May 2026",
    title: "NIST CSF 2.0 alignment",
    bullets: [
      "Twelve NIST Cybersecurity Framework 2.0 outcomes across Govern, Identify, Protect, Detect, Respond, and Recover",
      "Function maturity tiers (Partial through Adaptive) from shared audit and policy evidence",
      "Console at /governance/compliance/nist-csf; GET /api/governance/compliance/nist-csf",
      "Program dashboard and evidence export add nist_csf_controls — no migration",
    ],
  },
  {
    date: "May 2026",
    title: "HIPAA Security Rule mapping",
    bullets: [
      "Eleven HIPAA safeguards (45 CFR 164) in the compliance catalog with readiness and gap analysis",
      "Console at /governance/compliance/hipaa; healthcare_baa vendor category for full BAA control inheritance",
      "GET /api/governance/compliance/hipaa; evidence export adds hipaa_controls column",
      "Migration #29 — healthcare_baa third_party_vendors category",
    ],
  },
  {
    date: "May 2026",
    title: "PCI DSS control pack",
    bullets: [
      "Eleven representative PCI DSS v4 requirements in the compliance catalog",
      "Readiness scoring and gap analysis at /governance/compliance/pci-dss",
      "Audit and policy mappings reuse shared evidence; export adds pci_dss_controls column",
      "Program dashboard rollup includes PCI readiness — no migration",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance program dashboard",
    bullets: [
      "Executive rollup across SOC 2 Type II, ISO 27001, control attestations, and third-party vendors",
      "Weighted program readiness score with top gaps and overdue attestation queue",
      "Console at /governance/compliance/program; GET /api/governance/compliance/program",
      "No migration — aggregates existing compliance modules at read time",
    ],
  },
  {
    date: "May 2026",
    title: "Third-party risk register",
    bullets: [
      "Vendor inventory with risk tier, category, and status",
      "Inherited SOC 2 / ISO controls per vendor with attestation and audit evidence reuse",
      "Console at /governance/third-party-risk; GET/POST /api/governance/third-party/vendors",
      "Migration #28 — third_party_vendors + third_party_vendor_controls",
    ],
  },
  {
    date: "May 2026",
    title: "Control attestation workflows",
    bullets: [
      "Per-control owner assignment, due dates, and sign-off with append-only attestation trail",
      "Console at /governance/compliance/attestations; links to mapped audit evidence (30d)",
      "GET /api/governance/compliance/attestations — attestation board JSON",
      "Migration #27 — compliance_control_attestations + compliance_control_attestation_events",
    ],
  },
  {
    date: "May 2026",
    title: "ISO 27001 continuous assessment",
    bullets: [
      "Annex A control monitoring with 30d vs prior 30d trends and domain readiness rollup",
      "Gap analysis surfaces missing, partial, and regressed controls by organizational and technological domain",
      "GET /api/governance/compliance/iso-assessment — structured assessment JSON for assessors",
      "Shared continuous-assessment engine with SOC 2 Type II (no new migration)",
    ],
  },
  {
    date: "May 2026",
    title: "SOC 2 Type II report mode",
    bullets: [
      "Continuous control monitoring dashboard with 30d vs prior 30d trends and exceptions",
      "Auditor org role — read-only workspace limited to governance/compliance and /audit",
      "GET /api/governance/compliance/type-ii — structured report JSON for assessor workpapers",
      "Migration #26 — auditor role on organization_members",
    ],
  },
  {
    date: "May 2026",
    title: "Assessor evidence bundles",
    bullets: [
      "Persisted compliance packs with SHA-256 manifests over JSON and CSV artifacts",
      "Console at /governance/compliance/bundles; optional HTTPS webhook delivery per org",
      "POST /api/governance/compliance/bundles and cron POST .../bundles/scheduled",
      "Migration #25 — compliance_evidence_bundles table + evidence_bundle_webhook_url",
    ],
  },
  {
    date: "May 2026",
    title: "Legal hold markers",
    bullets: [
      "Incidents can be frozen with reason and timestamp; linked audit rows inherit hold",
      "Retention purge (apply_org_retention_policy) skips held incidents and audit evidence",
      "Console at /governance/legal-holds; apply/clear from incident detail (owner/admin)",
      "Migration #24 — legal_hold columns and updated org purge helpers",
    ],
  },
  {
    date: "May 2026",
    title: "Custom retention policies",
    bullets: [
      "Org-level audit and closed-incident retention overrides capped by deployment tier",
      "Effective policy display and editor on /settings/deployment",
      "GET /api/deployment/retention — tier defaults, overrides, and max limits",
      "Migration #23 — apply_org_retention_policy(org_id) purge helper for scheduled jobs",
    ],
  },
  {
    date: "May 2026",
    title: "Org-scoped audit log",
    bullets: [
      "audit_log.org_id shares append-only evidence across organization members",
      "Role-aware event filters on /audit — viewer, operator, and approver subsets",
      "CSV export gated by org role; compliance packs use org-scoped audit rows",
      "Migration #22 — audit_log org_id column, indexes, and member RLS policy",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance evidence export",
    bullets: [
      "CSV and JSON assessor packs with SOC 2 / ISO control columns on audit events",
      "Accepted automation policies included with guardrail metadata",
      "Export buttons on /governance/compliance; GET /api/governance/compliance/export",
      "Appends governance.compliance_exported audit event on download",
    ],
  },
  {
    date: "May 2026",
    title: "FedRAMP-oriented deployment",
    bullets: [
      "Org deployment tier (standard / regulated / fedramp_ready) with region and data boundary",
      "GovCloud validation: FedRAMP-ready requires gov_cloud boundary + us-gov-* region",
      "Console at /settings/deployment; GET /api/deployment/profile",
      "Migration #21 — organizations.deployment_tier, data_region, data_boundary",
    ],
  },
  {
    date: "May 2026",
    title: "Compliance control mapping",
    bullets: [
      "SOC 2 TSC and ISO 27001 annex A control tags on audit_log event types",
      "Accepted automation policies contribute policy-side evidence in coverage matrix",
      "Console at /governance/compliance; control badges on /audit",
      "GET /api/governance/compliance/summary — computed at read time (no migration)",
    ],
  },
  {
    date: "May 2026",
    title: "Attack path simulation",
    bullets: [
      "What-if paths from open high/critical vulns through dependency pivots to production targets",
      "Console at /assets/attack-paths with ranked risk scores and step-by-step path detail",
      "GET /api/attack-paths/simulate (optional targetServiceId, maxDepth)",
      "Computed at read time — uses org-scoped services, dependencies, and findings",
    ],
  },
  {
    date: "May 2026",
    title: "Org SLO & dependencies",
    bullets: [
      "SLO configs, error budget snapshots, and dependency edges share org scope with the service catalog",
      "Burn triage on /services and /overview reflects org-wide incident history",
      "Automation SLO guardrails use org-scoped burn state during critical budget windows",
      "Migration #20 — org_id on service_slos, error_budget_windows, service_dependencies",
    ],
  },
  {
    date: "May 2026",
    title: "Exposure prioritization",
    bullets: [
      "Vulnerability queue ranked by exposure score (CVSS + asset criticality + recency)",
      "Matches findings to service catalog environment (production hosts surface first)",
      "Console stats: urgent count and production-asset exposure at /assets/vulnerabilities",
      "Computed at read time — no migration required",
    ],
  },
  {
    date: "May 2026",
    title: "Pen-test finding rollup",
    bullets: [
      "Auto-link new vulnerability findings to active pen-test scope (host matching)",
      "Increments pen_test_engagements.findings_count via increment_pen_test_findings_count()",
      "Optional header X-Zentro-Pen-Test-Engagement to force engagement attribution",
      "Migration #19 — vulnerability_findings.pen_test_engagement_id",
    ],
  },
  {
    date: "May 2026",
    title: "Org-wide resource scope",
    bullets: [
      "Shared incidents, services, and automation history for active organization",
      "Migration #18 — org_id on incidents, services, automation_dry_runs, automation_executions",
      "Alert/vuln ingest attributes incidents to primary org membership",
    ],
  },
  {
    date: "May 2026",
    title: "Organization RBAC",
    bullets: [
      "Organizations + member roles (owner, admin, operator, approver, security reviewer, viewer)",
      "Delegated approval queue with self-approval prevention",
      "Members console at /settings/members",
      "Migration #17 — org RBAC tables and approval_requests org columns",
    ],
  },
  {
    date: "May 2026",
    title: "Vulnerability & pen-test operations",
    bullets: [
      "Qualys/Tenable ingest via POST /api/integrations/vulnerabilities",
      "Exposure queue console at /assets/vulnerabilities",
      "Pen-test engagement tracking at /changes/pentest",
      "Migration #16 — vulnerability_findings + pen_test_engagements tables",
    ],
  },
  {
    date: "May 2026",
    title: "Cybersecurity & enterprise positioning",
    bullets: [
      "SIEM/EDR alert adapters: Splunk, Microsoft Sentinel, CrowdStrike via POST /api/integrations/alerts",
      "Pricing compare matrix (Pro / Team / Enterprise) at /pricing",
      "Homepage upgrade — SOC metrics strip, 6-panel command preview, cyber + enterprise sections",
      "New pages: /cybersecurity, /enterprise, /next",
    ],
  },
  {
    date: "May 2026",
    title: "Postgres & platform spine",
    bullets: [
      "Postgres excellence migration (#15), /api/health/db, Supabase CLI config",
      "Expanded modules and use cases on marketing site",
    ],
  },
  {
    date: "April 2026",
    title: "Console UX and API docs",
    bullets: [
      "Route-level loading skeletons (incidents, overview, automations, audit, approvals, services, copilot, runbooks, hub, vision, new incident, runbook detail)",
      "Richer empty states (incidents, audit, services catalog, approvals) with guided CTAs",
      "Public /docs/api catalog + OpenAPI sketch from lib/docs/api-catalog",
    ],
  },
  {
    date: "April 2026",
    title: "Positioning and buyer narrative",
    bullets: [
      "Public /platform overview — flow, guarded model, capabilities, differentiation, architecture",
      "Learn hub at /docs, /why philosophy page, /pricing, /status, /changelog",
      "Homepage: product preview strip, mechanics grid, use cases, control section",
    ],
  },
  {
    date: "April 2026",
    title: "Incidents and operations depth",
    bullets: [
      "Incident owner hint, runbook slug, markdown export API",
      "Health endpoint hardening and public status cleanup",
      "Alert ingest payload extensions",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className={mArticle}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">
            {SITE_BRAND_NAME}
          </p>
          <h1 className={`mt-2 ${mH1}`}>Changelog</h1>
          <p className={`mt-4 ${mBody}`}>
            High-level shipped work — not every commit. For source history, use the GitHub
            repository.
          </p>
          <ol className="mt-10 space-y-6">
            {ENTRIES.map((e) => (
              <li key={e.title} className={mCard}>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent/90">{e.date}</p>
                <h2 className={`mt-2 ${mH2}`}>{e.title}</h2>
                <ul className={`mt-4 list-inside list-disc space-y-2 ${mBody}`}>
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className={`mt-14 ${mBody}`}>
            <Link href="/" className="font-medium text-accent hover:underline">
              ← Home
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
