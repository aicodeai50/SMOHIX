/**
 * Single source of truth for public HTTP API reference (/docs/api).
 * Update when adding or changing route handlers under app/api.
 */
export type ApiOperation = {
  method: string;
  path: string;
  summary: string;
  auth?: string;
  notes?: string;
};

export type ApiGroup = {
  id: string;
  title: string;
  description?: string;
  operations: ApiOperation[];
};

export const API_GROUPS: ApiGroup[] = [
  {
    id: "health",
    title: "Health",
    description: "Liveness for load balancers; no auth.",
    operations: [
      { method: "GET", path: "/api/health", summary: "JSON ok, service name, and uptime seconds." },
      { method: "HEAD", path: "/api/health", summary: "Same as GET without body." },
    ],
  },
  {
    id: "incidents",
    title: "Incidents",
    operations: [
      {
        method: "GET",
        path: "/api/incidents/{id}/export",
        summary: "Download incident as Markdown (authenticated Supabase user).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/incidents/{id}/evidence",
        summary: "Download incident evidence pack JSON (timeline, dry-run, audit-linked events).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/incidents/{id}/review",
        summary: "Download post-incident review Markdown (narrative, timeline, execution evidence, audit snapshot).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/incidents/{id}/rca/run",
        summary: "Generate and persist an incident RCA hypothesis with confidence and evidence references.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/incidents/{id}/rca/latest",
        summary: "Fetch latest persisted RCA run for an incident.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/services/{id}/slo",
        summary: "Fetch service SLO profile plus latest error budget windows (7d/30d).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/overview/error-budget-summary",
        summary: "Fetch SLO error budget overview across services (critical/warning burn and average used budget).",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    operations: [
      {
        method: "POST",
        path: "/api/integrations/alerts",
        summary: "Create or dedupe incident from monitoring (Bearer alert ingest token).",
        auth: "Bearer ingest token",
        notes:
          "Paid-gated per deployment; validates token server-side. Supports normalized Smohix payload, Datadog, Prometheus/Grafana Alertmanager, PagerDuty, and New Relic payloads (vendor-specific dedupe keys). Optional HMAC signature check via SMOHIX_ALERT_WEBHOOK_SIGNING_SECRET.",
      },
      {
        method: "POST",
        path: "/api/integrations/vulnerabilities",
        summary: "Upsert Qualys/Tenable finding; auto-open incident for high/critical (Bearer ingest token).",
        auth: "Bearer ingest token",
        notes:
          "Same token as alert ingest. Optional X-Smohix-Vuln-Source header. Supports Qualys (QID/HOST), Tenable (plugin/asset), or generic finding_id payloads.",
      },
      {
        method: "GET",
        path: "/api/health/db",
        summary: "Postgres readiness via database health RPC (requires migration #15).",
        auth: "None",
      },
      {
        method: "GET",
        path: "/api/connectors/status",
        summary: "Probe configured reasoning/automation connector URLs.",
        auth: "Session cookie when Supabase auth is enabled",
      },
      {
        method: "GET",
        path: "/api/integrations/connections",
        summary: "List org-scoped first-party integration connection records.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/integrations/connections",
        summary: "Create an org-scoped integration connection placeholder for Slack, PagerDuty, Jira, ServiceNow, GitHub, Datadog, or Prometheus.",
        auth: "Session cookie (owner/admin/operator)",
      },
      {
        method: "POST",
        path: "/api/integrations/deploy-events",
        summary: "Ingest an authenticated deploy/change event for incident and Copilot correlation.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/integrations/slack/approvals",
        summary: "Receive signed Slack action payloads and decide pending approvals.",
        auth: "Slack request signature (X-Slack-Signature)",
      },
      {
        method: "POST",
        path: "/api/approvals/policy-suggestions/promote",
        summary: "Promote a decision-intelligence policy suggestion into policy review and log audit evidence.",
        auth: "Session cookie (or session mode fallback)",
      },
      {
        method: "GET",
        path: "/api/deployment/profile",
        summary: "Active organization deployment tier, data region, and boundary (FedRAMP-oriented).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/deployment/retention",
        summary: "Effective org retention policy for audit_log and closed incidents (tier defaults + overrides).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/summary",
        summary: "SOC 2 / ISO 27001 control coverage from audit_log and accepted policies (30d window).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/program",
        summary:
          "Compliance program dashboard — weighted readiness, SOC 2 / ISO gaps, attestation and vendor rollups.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/gap-remediations",
        summary:
          "Gap-to-runbook remediation queue from live assessment exceptions plus org tracking rows.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/risk-heatmap",
        summary:
          "Compliance risk heatmap — framework concentration, vendor tier matrix, and top hotspots from live org data.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/executive-summary",
        summary:
          "Board-ready GRC executive summary — program readiness, frameworks, hotspots, and leadership actions (JSON, Markdown, HTML, CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/calendar",
        summary:
          "GRC compliance calendar — attestations, vendor reviews, bundles, audit season checkpoints (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/benchmarking",
        summary:
          "Control benchmarking — org readiness percentiles vs industry reference cohorts (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/policy-drift",
        summary:
          "Policy drift — accepted automation guardrails vs live assessment gaps (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/control-graph",
        summary:
          "Control dependency graph — crosswalk, thematic, shared audit, and shared policy edges (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/regulatory-impact",
        summary:
          "Regulatory change impact — scenario readiness deltas vs live baseline (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/evidence-lineage",
        summary:
          "Evidence lineage — audit and policy sources through bundles to assessor workbook (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/testing-evidence-linker",
        summary:
          "Control testing evidence linker — dry-run outputs mapped to controls and evidence bundles (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/testing-evidence-linker",
        summary: "Record test-to-bundle links in audit log for assessor export trail.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/testing-schedules",
        summary:
          "Control testing schedules — recurring evidence windows from attestations, checkpoints, and freshness (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/scope-boundary",
        summary:
          "Scope boundary mapper — in-scope systems, data flows, and framework control mappings (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/kpi-trends",
        summary:
          "Compliance KPI trends — weekly remediation velocity, attestation closure, framework readiness (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/posture-score",
        summary:
          "Unified compliance posture score — blended readiness, attestations, vendors, gaps, risk (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/control-ownership",
        summary:
          "GRC control ownership matrix — RACI per control linked to scope and attestations (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/exception-register",
        summary:
          "Compliance exception register — assessment gaps, policy drift, compensating remediations (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/evidence-requests",
        summary:
          "Assessor evidence request workflow — open document requests with due dates and control linkage (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/evidence-request-sla",
        summary:
          "Evidence request SLA dashboard — overdue queue, at-risk window, fulfillment metrics (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/evidence-request-sla",
        summary: "Deliver auditor evidence request SLA digest (email + optional webhook).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/evidence-request-sla/scheduled",
        summary: "Cron SLA digest delivery (Bearer SMOHIX_EVIDENCE_REQUEST_SLA_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-ics",
        summary:
          "Compliance obligation ICS — iCalendar feed of attestations, vendors, bundles, checkpoints (text/calendar).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/mapping-digest",
        summary: "Preview regulatory mapping change digest vs last org snapshot.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/mapping-digest",
        summary: "Run mapping change digest — webhook/email when catalog or crosswalk changes.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/mapping-digest/scheduled",
        summary: "Cron mapping digest (Bearer SMOHIX_MAPPING_DIGEST_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/inherited-control-gaps",
        summary:
          "Inherited control coverage gaps — vendors missing evidence on tier-inherited controls (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/control-health-scorecard",
        summary:
          "Leadership control health scorecard — posture, vendor inherited controls, and gap closure (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-heatmap",
        summary:
          "Regulatory obligation heatmap — open obligations by framework, vendor tier, and testing schedule (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-crossover",
        summary:
          "Multi-framework obligation crossover — shared due windows and crosswalk-linked evidence reuse clusters (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-consolidation",
        summary:
          "Obligation consolidation playbook — six-step workflows per crossover cluster with tracked play status (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-forecast",
        summary:
          "Board obligation forecast — weekly forward-looking obligation density and committee milestones (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-whatif",
        summary:
          "Board obligation what-if — stress-test forecast density with week shifts or framework descope (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/committee-capacity-budget",
        summary:
          "Committee obligation capacity budget — weekly owner-hours vs forecast peaks with shortfall flags (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-load-balancing",
        summary:
          "Obligation owner load balancing — peak-week RACI load slices and rebalance suggestions (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/peak-week-staffing-digest",
        summary:
          "Peak-week staffing digest — capacity shortfall + load imbalance coincidence preview (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/peak-week-staffing-digest",
        summary: "Deliver peak-week staffing digest (email, Slack, optional webhook).",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/peak-week-staffing-digest/scheduled",
        summary:
          "Cron peak-week staffing digest (Bearer SMOHIX_PEAK_WEEK_STAFFING_DIGEST_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/staffing-actions",
        summary:
          "Obligation staffing action tracker — proposed and tracked load-balance and capacity relief actions (JSON, CSV, or HTML completion report).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/staffing-action-reminders",
        summary:
          "Staffing action overdue reminders — open actions past peak week preview (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/staffing-action-reminders",
        summary: "Send staffing action overdue reminders (email and Slack).",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/staffing-action-reminders/scheduled",
        summary:
          "Cron staffing overdue reminders (Bearer SMOHIX_STAFFING_OVERDUE_REMINDER_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/staffing-completion-rollup",
        summary:
          "Staffing completion rollup — tracked vs open vs completed archive (JSON, CSV, or printable HTML).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/staffing-completion-rollup",
        summary: "Email weekly staffing completion rollup to owners and admins.",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/staffing-completion-rollup/scheduled",
        summary:
          "Cron staffing completion rollup (Bearer SMOHIX_STAFFING_COMPLETION_ROLLUP_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/staffing-sla-breach-digest",
        summary:
          "Staffing SLA breach digest — open actions past committee completion SLA after peak week (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/staffing-sla-breach-digest",
        summary: "Deliver staffing SLA breach digest (email and Slack).",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/staffing-sla-breach-digest/scheduled",
        summary:
          "Cron staffing SLA breach digest (Bearer SMOHIX_STAFFING_SLA_BREACH_DIGEST_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/cross-staffing-committee-escalation",
        summary:
          "Cross-staffing committee escalation — SLA breaches still open after completion rollup email (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/cross-staffing-committee-escalation",
        summary: "Deliver cross-staffing committee escalation (email and Slack).",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/cross-staffing-committee-escalation/scheduled",
        summary:
          "Cron cross-staffing committee escalation (Bearer SMOHIX_CROSS_STAFFING_COMMITTEE_ESCALATION_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/staffing-digest-auto-chain/scheduled",
        summary:
          "Cron staffing digest auto-chain — rollup, SLA digest, escalation in one run (Bearer SMOHIX_STAFFING_DIGEST_AUTO_CHAIN_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/committee-digest",
        summary:
          "Quarterly obligation committee digest — forecast, crossover, and SLA rollup preview (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/committee-digest",
        summary: "Deliver quarterly obligation committee digest (email + optional webhook).",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/committee-digest/scheduled",
        summary:
          "Cron quarterly digest delivery (Bearer SMOHIX_OBLIGATION_COMMITTEE_DIGEST_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-rollup",
        summary:
          "Obligation executive rollup — printable HTML (print to PDF), JSON, or CSV for board packets.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-density-alerts",
        summary:
          "Obligation density alerting — forecast breach preview against org thresholds (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/obligation-density-alerts",
        summary: "Send obligation density Slack and email alerts for active breaches.",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/obligation-density-alerts/scheduled",
        summary:
          "Cron obligation density alerts (Bearer SMOHIX_OBLIGATION_DENSITY_ALERT_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/obligation-density-trend-history",
        summary:
          "Obligation density trend history — trailing-quarter weekly density and alert deliveries (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/committee-meeting-pack",
        summary:
          "Committee meeting pack ZIP — printable HTML summary, scorecard, posture, exceptions, and open gaps.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/attestation-renewal",
        summary:
          "Attestation renewal calendar — renewal waves by due window with framework rollup (JSON or CSV).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/attestation-renewal",
        summary: "Email control owners for current renewal waves (org admins).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/attestation-renewal/scheduled",
        summary: "Cron owner renewal nudges (Bearer SMOHIX_ATTESTATION_RENEWAL_CRON_SECRET).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/legal-holds",
        summary: "Active legal holds on incidents and count of audit rows flagged (org-scoped).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/bundles",
        summary: "List persisted assessor evidence bundles for the active organization.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/bundles",
        summary: "Create tamper-evident evidence bundle; optional webhook delivery to org URL.",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/bundles/scheduled",
        summary: "Cron entrypoint to generate bundle (Bearer SMOHIX_BUNDLE_CRON_SECRET, body: orgId, window).",
        auth: "Bearer cron secret",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/bundles/{id}",
        summary: "Fetch persisted evidence bundle metadata and manifest verification for the active org.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/bundles/{id}/download",
        summary: "Download evidence bundle ZIP archive by bundle id.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/crosswalk",
        summary:
          "SOC 2 / ISO 27001 crosswalk — mapping matrix with optional periodDays and format=csv|json; evidence overlay per control.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/workbook",
        summary:
          "Unified assessor workbook ZIP — evidence pack, crosswalk, framework assessments, README, and tamper-evident manifest.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/digest",
        summary:
          "Compliance program digest — readiness deltas vs prior snapshot, overdue attestations; optional HTTPS webhook delivery.",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/digest/scheduled",
        summary:
          "Cron digest delivery — Bearer SMOHIX_DIGEST_CRON_SECRET; body { orgId, periodDays? }.",
        auth: "Bearer SMOHIX_DIGEST_CRON_SECRET",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/sla-reminders",
        summary: "Preview SLA reminder candidates (due soon, overdue, regressed) and org settings.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/sla-reminders",
        summary: "Send compliance SLA reminders via Slack and optional Resend email (owner/admin).",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/sla-reminders/scheduled",
        summary: "Cron SLA reminders — Bearer SMOHIX_SLA_CRON_SECRET; body { orgId }.",
        auth: "Bearer SMOHIX_SLA_CRON_SECRET",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/fedramp-poam",
        summary:
          "FedRAMP POA&M export — NIST 800-53 rows from continuous assessment gaps; periodDays and format=csv|json.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/evidence-freshness",
        summary:
          "Evidence freshness dashboard — per-control last evidence timestamps, stale queue; format=csv|json.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/baseline-comparison",
        summary:
          "Multi-framework baseline comparison — live readiness and prior-period deltas for all framework packs; format=csv|json.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/assessor-tokens",
        summary: "List org assessor API tokens and allowed export resource paths.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/compliance/assessor-tokens",
        summary: "Create org assessor API token (smohix_ca_*); returns plaintext key once.",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "DELETE",
        path: "/api/governance/compliance/assessor-tokens/{id}",
        summary: "Revoke assessor API token.",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/assessor/{id}",
        summary:
          "Assessor read-only export — evidence-export, workbook, crosswalk, obligation-ics, baseline-comparison, risk-heatmap, executive-summary, framework reports; Bearer smohix_ca_* token.",
        auth: "Bearer assessor token",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/export",
        summary: "Compliance evidence pack — audit events + accepted policies with control tags (CSV or JSON).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/type-ii",
        summary:
          "SOC 2 Type II continuous monitoring report — control trends, exceptions, evidence bundle and legal-hold counts.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/iso-assessment",
        summary:
          "ISO 27001 Annex A continuous assessment — domain readiness, control trends, and gap analysis.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/pci-dss",
        summary:
          "PCI DSS v4 control pack — requirement readiness, trends, and gap analysis from shared audit evidence.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/hipaa",
        summary:
          "HIPAA Security Rule safeguards — readiness, trends, gap analysis, and BAA vendor control inheritance.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/nist-csf",
        summary:
          "NIST CSF 2.0 alignment — function maturity tiers, control trends, and gap analysis from shared audit evidence.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/cis-v8",
        summary:
          "CIS Controls v8 safeguard pack — Implementation Group readiness, control trends, and gap analysis.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/cmmc-l2",
        summary:
          "CMMC 2.0 Level 2 overlay — 800-171 practice readiness, SPRS-style score, and gap analysis.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/gdpr-art32",
        summary:
          "GDPR Article 32 technical measures — domain readiness, DPA bands, and gap analysis.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/compliance/attestations",
        summary:
          "Control attestation board — owners, due dates, status, linked audit evidence counts per SOC 2 / ISO control.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/governance/third-party/vendors",
        summary:
          "Third-party risk register — vendors with inherited controls, attestation status, and reused audit evidence counts.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/governance/third-party/vendors",
        summary: "Add vendor; inherit SOC 2 / ISO controls from risk tier and category (owner/admin).",
        auth: "Session cookie (owner/admin)",
      },
      {
        method: "GET",
        path: "/api/governance/policy-blocks/summary",
        summary:
          "Return policy-block analytics summary for current user (window=7d|30d, includes prior-window delta and reason distribution).",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "automations",
    title: "Automations",
    operations: [
      {
        method: "POST",
        path: "/api/automations/dry-run",
        summary: "Run playbook dry-run; may persist and append audit when configured.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/automations/execute",
        summary: "Record guarded execution after successful dry-run with approval note and rollback plan.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/automations/remediate",
        summary: "Run guarded remediation with dry-run freshness and accepted policy checks.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/automations/policies",
        summary: "List versioned automation policy-as-code documents for the active workspace.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/automations/policies",
        summary: "Create a draft or active policy-as-code version for a playbook.",
        auth: "Session cookie (owner/admin/operator)",
      },
      {
        method: "GET",
        path: "/api/attack-paths/simulate",
        summary: "Simulate ranked attack paths from vuln entry points through dependency graph to production targets.",
        auth: "Session cookie",
        notes: "Optional query: targetServiceId, maxDepth.",
      },
      {
        method: "GET",
        path: "/api/services/dependency-graph",
        summary: "Fetch service dependency graph (nodes and directed edges).",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "copilot",
    title: "Copilot",
    operations: [
      {
        method: "POST",
        path: "/api/copilot/chat",
        summary: "Streaming or JSON chat completion (OpenAI → reasoning URL → guided offline).",
        auth: "Session cookie when OPENAI_API_KEY and Supabase auth are set; otherwise IP rate limit",
      },
      { method: "GET", path: "/api/copilot/threads", summary: "List conversation threads.", auth: "Session cookie" },
      {
        method: "POST",
        path: "/api/copilot/threads",
        summary: "Create thread.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/copilot/threads/{id}/messages",
        summary: "List messages in a thread.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/copilot/threads/{id}/messages",
        summary: "Append user message and run assistant turn.",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "user",
    title: "User-scoped keys",
    operations: [
      {
        method: "GET",
        path: "/api/user/api-keys",
        summary: "List API keys (metadata).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/user/api-keys",
        summary: "Create API key (returns plaintext once).",
        auth: "Session cookie",
      },
      {
        method: "DELETE",
        path: "/api/user/api-keys/{id}",
        summary: "Revoke key.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/user/alert-ingest-tokens",
        summary: "List alert ingest tokens.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/user/alert-ingest-tokens",
        summary: "Create ingest token (returns secret once).",
        auth: "Session cookie",
      },
      {
        method: "DELETE",
        path: "/api/user/alert-ingest-tokens/{id}",
        summary: "Revoke ingest token.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/user/export",
        summary: "Download JSON export of user incidents and profile metadata.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/user/notification-preferences",
        summary: "Read notification preference flags.",
        auth: "Session cookie",
      },
      {
        method: "PUT",
        path: "/api/user/notification-preferences",
        summary: "Update notification preference flags on profile.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/user/account/delete-request",
        summary: "Submit account deletion request for manual review.",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "proxy",
    title: "Connector proxies",
    description: "Forward to REACT_APP_SH_BACKEND_API and REACT_APP_ROBOT_BACKEND when set.",
    operations: [
      {
        method: "GET|POST|PUT|PATCH|DELETE",
        path: "/api/reasoning/*",
        summary: "Proxy to reasoning backend.",
        auth: "Session cookie or Smohix API key (Bearer smohix_sk_… / X-Smohix-Api-Key)",
      },
      {
        method: "GET|POST|PUT|PATCH|DELETE",
        path: "/api/robot/*",
        summary: "Proxy to automation robot backend.",
        auth: "Session cookie or Smohix API key (Bearer smohix_sk_… / X-Smohix-Api-Key)",
      },
    ],
  },
  {
    id: "audit",
    title: "Audit",
    operations: [
      {
        method: "GET",
        path: "/api/audit/export",
        summary: "Download all audit_log rows for the signed-in user as CSV (optional window=24h|7d|30d|all).",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/audit/slack-events/export",
        summary: "Download Slack delivery audit rows as CSV (optional window=24h|7d|30d|all).",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & leads",
    description: "Public contact intake and platform-admin lead review on smohix.run.",
    operations: [
      {
        method: "POST",
        path: "/api/contact",
        summary: "Submit a contact or pilot enquiry (validated, rate-limited, stored via service role).",
        auth: "None (public form)",
        notes:
          "Returns referenceId (ZEN-XXXXXX). Honeypot, consent, and minimum submit duration enforced. No PII in logs.",
      },
      {
        method: "GET",
        path: "/api/admin/leads",
        summary: "List contact leads with pagination and filters (platform admin email allowlist).",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "PATCH",
        path: "/api/admin/leads",
        summary: "Update lead status, internal notes, or assignment.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "GET",
        path: "/api/admin/leads/{id}",
        summary: "Lead detail with append-only activity history.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "PATCH",
        path: "/api/admin/leads/{id}",
        summary: "Update lead pipeline fields (stage, owner, follow-up, priority).",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "POST",
        path: "/api/admin/leads/{id}/convert-pilot",
        summary: "Create pilot project from lead (admin action only).",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "POST",
        path: "/api/admin/leads/{id}/email",
        summary: "Prepare or send follow-up email template (Resend if configured).",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "GET",
        path: "/api/admin/leads/export",
        summary: "CSV export of filtered leads (formula-safe).",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "GET",
        path: "/api/admin/dashboard",
        summary: "RevOps dashboard metrics from live lead/pilot data.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "GET",
        path: "/api/admin/pilots",
        summary: "List pilot projects.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "POST",
        path: "/api/admin/pilots",
        summary: "Create pilot from lead ID.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "GET",
        path: "/api/admin/pilots/{id}",
        summary: "Pilot detail with activity history.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "PATCH",
        path: "/api/admin/pilots/{id}",
        summary: "Update pilot fields and status.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "GET",
        path: "/api/admin/pilots/{id}/proposal",
        summary: "Deterministic pilot proposal (JSON, HTML, or Markdown).",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "GET",
        path: "/api/admin/pilots/{id}/calendar",
        summary: "Download .ics for discovery, kickoff, or review dates.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
      {
        method: "GET",
        path: "/api/admin/pilots/export",
        summary: "CSV export of pilot projects.",
        auth: "Session cookie + SMOHIX_PLATFORM_ADMIN_EMAILS",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    operations: [
      {
        method: "GET",
        path: "/api/billing/checkout",
        summary: "Redirect signed-in user to PayPal approval URL for tier (pro|team|top_up).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/billing/checkout",
        summary: "Create PayPal subscription or top-up order; returns approvalUrl.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/webhooks/paypal",
        summary: "PayPal billing webhook (subscriptions, top-ups, cancellations).",
        auth: "PayPal webhook signature",
      },
      {
        method: "POST",
        path: "/api/webhooks/lemonsqueezy",
        summary: "Lemon Squeezy subscription webhook (legacy).",
        auth: "Webhook signature (Lemon)",
      },
    ],
  },
];
