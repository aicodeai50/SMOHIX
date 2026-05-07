# Zentro vision & roadmap

**Audience:** product, design, and engineering. **Companion:** [`PLATFORM_PLAN.md`](./PLATFORM_PLAN.md) (what is implemented vs in-flight in the repo).

This file is the **north star**: serious ops platform first, then a deliberately ambitious “2050” horizon. Items below are **not all committed work**—they are ordered intent so we can ship incrementally and revisit priorities each quarter.

---

## How to use this doc

| Track | Meaning |
|--------|---------|
| **Near** | Feasible with current stack (Next + Supabase + webhooks + proxies); aligns with existing modules. |
| **Mid** | Needs new data models, integrations, or team process; still “2026–2028 realistic”. |
| **Horizon** | Research / long-term; may depend on ML reliability, customer trust, and regulatory posture. |

---

## Track 1 — Core: operations console that runs things

| Capability | Label | Near / Mid | Notes |
|------------|-------|--------------|--------|
| Unified incident view | All incidents in one place | **Near** | Status, severity, timeline, service link, postmortem, alert ingest (paid). **Next:** explicit owner field, linked automation runs. |
| Runbooks & playbooks | “When X happens, do Y” | **Near** | Runbook catalog + steps today. **Next:** suggest or attach runbook from incident context / Copilot. |
| Guarded automation triggers | Safe buttons, not raw scripts | **Mid** | Dry-runs exist; **next:** policy-gated “actions” with confirmation, environment allowlists, audit line per click. |
| Change log timeline | “What changed before this broke?” | **Mid** | Deploys, config, flags, automation runs in one incident-scoped timeline. |

---

## Track 2 — Policy & access: safe for real teams

| Capability | Label | Near / Mid | Notes |
|------------|-------|--------------|--------|
| Org sign-in & SSO | Sign in with your org | **Mid** | Today: per-user auth. **Next:** org / workspace model, IdP SSO. |
| Roles & permissions | Admin / Operator / Viewer | **Mid** | RLS today is per-user; extend with org roles and action policies. |
| Guardrails on automation | “This action requires approval” | **Mid** | Tie to **Approvals** + rules (e.g. two-person, maintenance window, env). |
| Audit log | Who did what, when, and why | **Near** | `audit_log` + `/audit`; expand event types as features land. |

---

## Track 3 — Intelligence: Zentro as reasoning layer

| Capability | Label | Near / Mid | Notes |
|------------|-------|--------------|--------|
| Incident summarization | “What’s going on?” | **Near** | Copilot + threads; **next:** structured summary blocks (impact, blast radius, hypotheses). |
| Root cause hints | Likely cause candidates | **Mid** | Correlate deploys, ingest payloads, metrics (needs integrations). |
| Suggested actions | “Try this next” | **Mid** | Ranked actions with risk + permission hints; human-in-the-loop. |
| Post-incident reports | One-click review | **Near** | Postmortem field + timeline; **next:** export PDF / share link. |

---

## Track 4 — Modules: platform, not a single page

| Capability | Label | Near / Mid | Notes |
|------------|-------|--------------|--------|
| Modules catalog | Plug-in capabilities | **Mid** | Formal “module” registry: incident, automation, observability, change, AI. |
| Environment modules | Prod / staging / dev | **Mid** | Per-env incidents, policies, and connectors (column or workspace switcher). |
| Integration modules | Connect your stack | **Mid** | GitHub/GitLab/Jira/Slack/Teams/monitoring; start with webhooks + OAuth where safe. |

---

## Track 5 — Pro & Team: subscription means power

| Capability | Label | Near / Mid | Notes |
|------------|-------|--------------|--------|
| Team workspaces | Org workspace | **Mid** | Shared incidents, policies, billing; Lemon Team variant already in billing UX. |
| Pro-only surfaces | “This is why you pay” | **Near** | Automations + services/ingest gated; extend list as features mature. |
| Org-level billing | Bill the org, not the person | **Mid** | Seats, roles, invoice to org (product + Lemon metadata design). |

---

## Track 6 — Observability & context

| Capability | Label | Near / Mid | Notes |
|------------|-------|--------------|--------|
| Service map | What depends on what | **Mid** | Graph from services + edges; health overlays. |
| Context panels | Everything about this service | **Mid** | Single service drawer: incidents, changes, metrics, automations. |
| SLO / error budget | Are we burning too fast? | **Horizon** | Tie SLO burn to incidents and Copilot context. |

---

## Track 7 — Governance & maturity

| Capability | Label | Near / Mid | Notes |
|------------|-------|--------------|--------|
| Policy templates | Best-practice guardrails | **Mid** | Presets: no direct prod edits, approvals for high risk, postmortem required. |
| Compliance exports | Audit + reports | **Mid** | CSV/PDF of audit + incidents for reviews. |
| Org-wide configuration | Central control | **Mid** | Default policies, modules, environments for new members. |

---

## Horizon — “2050-grade” (research & long-term)

These are **directional**, not committed backlog. Many depend on customer data volume, model safety, and legal review.

**Phase A — Hyper-intelligent ops (foundation)**  
Self-healing playbooks, predictive incident signals (forecasting from metrics), autonomous runbooks with approval gates, cross-system root-cause scoring, time-travel / config snapshots (replay state).

**Phase B — AI-native console**  
Conversational infra tasks (with execution behind policy), autonomous change risk scoring, institutional memory across incidents, multi-environment reasoning, natural-language → policy compilation.

**Phase C — Autonomous platform**  
Living dependency graph, safer zero-touch deploy pipelines, generated automations/dashboards (human-approved), proactive compliance checks.

**Phase D — Vision**  
Digital twin / simulation, multi-agent specialist agents (incident, deploy, security, policy) orchestrated with human oversight, continuous optimization, optional federated learning patterns (opt-in, privacy-preserving), “supervised autonomy” default.

**Phase E — Experience**  
Motion-rich but accessible UI, adaptive narration of system health (opt-in voice or text), calmer UX under incident load, guided onboarding, and a cohesive **Zentro OS** narrative for the whole console.

---

## Zentro-core pick (for the next v1 spec)

If one vertical must lead the next major release: **Incidents + automation + guardrails** — it closes the loop from **signal → triage → safe action → audit**, and every other track plugs into it.

---

## Maintenance

- Update **checkboxes and tables** when a capability ships or is explicitly deferred.
- Keep **PLATFORM_PLAN.md** as the engineering execution list; keep **this file** as the narrative and prioritization layer.
- Review quarterly: move items between Near / Mid / Horizon based on customer evidence.
