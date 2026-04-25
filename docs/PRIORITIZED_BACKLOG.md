# Shynvo Prioritized Backlog (Execution Plan)

This file turns strategy into shipping order. Priorities optimize for:
- Faster buyer trust
- Clear product differentiation
- Revenue path with minimal complexity

## P0 (Build now)

1. Slack decision-in-loop for approvals
   - Status: In progress (signed inbound endpoint shipped).
   - Goal: let teams act from Slack workflows/messages without opening console.
   - Done when:
     - Signed inbound action endpoint updates pending approvals.
     - Audit trail records source as Slack.

2. Approval latency + execution safety KPIs
   - Goal: show operational proof for teams and managers.
   - Done when:
     - Overview shows p50/p95 approval latency.
     - Execution failure and rollback-needed signals are visible.

3. Incident room basics
   - Goal: collaborative triage with clear ownership.
   - Done when:
     - Incident owner/assignee and handoff note fields exist.
     - Timeline captures owner changes.

## P1 (Next wave)

1. Policy-as-code v1
   - Versioned policy config, dry validation, rollback.

2. Connector resilience
   - Retry queue, dead-letter events, backoff diagnostics.

3. Export + compliance hardening
   - Signed exports, immutable evidence lock markers, longer retention options.

## P2 (Scale/enterprise)

1. Fine-grained RBAC + SSO/SAML
2. Team/org controls and billing-level feature governance
3. Executive reporting pack (weekly ops review + trend breakdown)

