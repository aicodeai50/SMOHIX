# Smohix Product Identity

Smohix (`smohix.run`) is the accountable operations platform within the SMOHIX ecosystem. It replaces the legacy **shynvo** branding and domain.

## What is Smohix?

**AI-assisted incident command and guarded automation** for production operations teams.

## Problem

Teams juggle alerts, runbooks, approvals, and audit evidence across disconnected tools. Changes happen without clear ownership or proof.

## Target audience

- Platform & SRE teams
- Security operations (SOC)
- GRC / compliance teams needing live evidence
- Engineering leads requiring human gates on risky automation

## Value proposition

> Run incidents and automation with full accountability — one workspace for command, guardrails, and audit-ready evidence.

## Key features

1. **Incident command** — track alerts through resolution with service context
2. **Guarded automation** — dry-run playbooks with approval gates
3. **Human-in-the-loop** — delegated approvers with Slack integration
4. **Audit evidence** — export immutable timelines for compliance

## Brand

| Token | Value |
|-------|-------|
| Primary | `#6366F1` (indigo) |
| Accent | `#10B981` (emerald) |
| Body font | Inter |
| Code font | JetBrains Mono |
| Spacing | 8px base grid |
| Theme | Dark mode default |

## Billing

PayPal replaces Lemon Squeezy:

- **Free** — explore console
- **Pro** ($29/mo) — individual operators
- **Team** ($79/mo) — shared org workspace
- **Top-ups** — prepaid balance via PayPal Orders

Webhook: `POST /api/webhooks/paypal`

Optional centralized billing: `SMOHIX_OWN_API_URL`

## Architecture

| Layer | Service |
|-------|---------|
| Frontend | This repo (`web/`) — Next.js |
| Automation | Robot backend (Railway internal) |
| SH API | sh-backend-api (Railway internal) |
| Auth & DB | Supabase |
| Billing | PayPal + optional SMOHIX-OWN-API |
