import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { appBody, appMeta } from "@/lib/app-typography";
import { ConsolePanel } from "@/components/app/ConsolePanel";

export const metadata: Metadata = {
  title: "Vision & roadmap",
  description: "Where Zentro is headed — serious ops platform and long-horizon product intent.",
};

const TRACKS = [
  {
    title: "Core operations console",
    tag: "Run things",
    items: [
      "Unified incident view — status, severity, timeline, services, ingest, postmortems; owners & linked runs next.",
      "Runbooks & playbooks — attach and suggest procedures from incidents and Copilot.",
      "Guarded automation — safe actions with confirmations, policies, and audit, not raw scripts.",
      "Change timeline — deploys, config, flags, and automation in one incident story.",
    ],
  },
  {
    title: "Policy & access",
    tag: "Teams",
    items: [
      "Org sign-in & SSO — workspaces, not only individual accounts.",
      "Roles — admin, operator, viewer; who can run actions, edit policies, see secrets.",
      "Guardrails — high-impact actions require approval, env allowlists, maintenance windows.",
      "Audit — who did what, when, with context (building on the audit log).",
    ],
  },
  {
    title: "Intelligence",
    tag: "Reasoning",
    items: [
      "Incident summarization — structured “what’s going on” from signals and history.",
      "Root-cause hints — correlate deploys, changes, and error spikes.",
      "Suggested actions — ranked, with risk and permission hints.",
      "Post-incident reports — one-click narrative from timeline + notes.",
    ],
  },
  {
    title: "Modular platform",
    tag: "Grow",
    items: [
      "Module catalog — incident, automation, observability, change, AI as first-class plugins.",
      "Per-environment views — prod / staging / dev slices of incidents and policies.",
      "Integrations — GitHub, GitLab, Jira, Slack/Teams, cloud, monitoring (webhooks + OAuth).",
    ],
  },
  {
    title: "Pro & Team",
    tag: "Revenue",
    items: [
      "Team workspaces — shared incidents, policies, and billing.",
      "Pro-only depth — advanced automation, SSO, custom policies, retention (extends today’s gates).",
      "Org billing — seats and invoices at the organization level.",
    ],
  },
  {
    title: "Observability & context",
    tag: "See the system",
    items: [
      "Service map — dependencies and health on a living graph.",
      "Context panels — everything about one service in one place.",
      "SLO & error budget — burn tied to incidents and changes.",
    ],
  },
  {
    title: "Governance",
    tag: "Mature orgs",
    items: [
      "Policy templates — best-practice guardrails out of the box.",
      "Compliance exports — audit and incident packets for reviews.",
      "Central configuration — defaults for policies, modules, and environments.",
    ],
  },
] as const;

const HORIZON = [
  "Hyper-intelligent ops: safer self-healing, forecasting, autonomous runbooks with approval gates, cross-system scoring, replayable state.",
  "AI-native console: conversational tasks behind policy, risk-aware change decisions, institutional memory, natural-language policies.",
  "Autonomous platform: living dependency intelligence, guarded deploy pipelines, human-approved generated automations and views.",
  "Long vision: supervised multi-agent workflows, digital-twin style simulation where appropriate, continuous optimization, opt-in federated patterns.",
  "Experience: motion-rich accessible UI, calm density under stress, guided onboarding, one coherent operating metaphor for the whole console.",
] as const;

export default function VisionPage() {
  return (
    <>
      <div className="zentro-vision-hero mb-8 rounded-2xl border border-white/[0.1] p-6 shadow-[0_0_80px_-30px_rgba(94,225,255,0.18)] md:p-8">
        <PageHeader
          className="mb-0"
          eyebrow="Strategy"
          title="Vision & roadmap"
          description="Zentro grows from a sharp operations console into a platform for policy, intelligence, and team scale — with a deliberate horizon toward supervised autonomy and ambient system awareness. Near-term work stays grounded in what we can ship with your stack today."
        />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {TRACKS.map((t) => (
          <ConsolePanel key={t.title} title={t.title}>
            <p className="mb-3 inline-flex rounded-md bg-accent-dim/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
              {t.tag}
            </p>
            <ul className={`space-y-2.5 text-muted ${appBody}`}>
              {t.items.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </ConsolePanel>
        ))}
      </div>

      <ConsolePanel title="Horizon — research & long-term direction">
        <p className={`text-muted ${appBody}`}>
          These ideas are <span className="font-medium text-foreground/90">research and long-term</span>{" "}
          — not a committed backlog. They inform tone, architecture, and partnerships (models, data
          residency, safety reviews) as Zentro matures.
        </p>
        <ul className={`mt-4 space-y-2.5 text-muted ${appBody}`}>
          {HORIZON.map((h) => (
            <li key={h} className="flex gap-2 border-t border-white/[0.05] pt-3 first:border-0 first:pt-0">
              <span className="font-mono text-[13px] leading-relaxed text-accent/80" aria-hidden>
                ◈
              </span>
              {h}
            </li>
          ))}
        </ul>
      </ConsolePanel>

      <p className={`mt-8 max-w-2xl text-pretty text-muted ${appMeta}`}>
        <span className="font-medium text-foreground/85">Next spec focus (recommended):</span> incidents +
        automation + guardrails — closes the loop from signal to triage to safe action to audit. Maintainer
        copy lives in{" "}
        <code className="rounded bg-white/[0.06] px-1.5 py-px font-mono text-[11px] text-accent/90">
          docs/VISION_AND_ROADMAP.md
        </code>{" "}
        alongside{" "}
        <code className="rounded bg-white/[0.06] px-1.5 py-px font-mono text-[11px] text-accent/90">
          docs/PLATFORM_PLAN.md
        </code>
        .
      </p>
      <p className={`mt-3 ${appMeta}`}>
        <Link
          href="https://github.com/aicodeai50/ZENTRO/blob/main/docs/VISION_AND_ROADMAP.md"
          className="font-medium text-accent hover:underline"
        >
          View on GitHub
        </Link>{" "}
        (same content as in the repo).
      </p>
    </>
  );
}
