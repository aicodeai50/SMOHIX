import { SITE_BRAND_NAME } from "@/lib/site-brand";

export type ProductFilmScene = {
  id: string;
  /** Lucide icon key */
  icon:
    | "intro"
    | "signal"
    | "workflow"
    | "dry-run"
    | "approval"
    | "execute"
    | "audit"
    | "outro";
  title: string;
  line: string;
};

export const PRODUCT_FILM_SCENES: ProductFilmScene[] = [
  {
    id: "intro",
    icon: "intro",
    title: `${SITE_BRAND_NAME}`,
    line: "IT operations with guardrails — incidents, automations, and proof in one console.",
  },
  {
    id: "signal",
    icon: "signal",
    title: "Something breaks",
    line: "Alerts arrive via ingest token or webhook, or a responder opens an incident — one controlled record.",
  },
  {
    id: "workflow",
    icon: "workflow",
    title: "One workspace",
    line: "Link the service, attach a runbook, align the team — everyone sees the same timeline.",
  },
  {
    id: "dry-run",
    icon: "dry-run",
    title: "Automation stays safe",
    line: "Playbooks and Copilot suggest next steps — dry-run and policy checks before anything touches production.",
  },
  {
    id: "approval",
    icon: "approval",
    title: "Humans in the loop",
    line: "High-risk changes wait for explicit approval — recorded, not lost in chat.",
  },
  {
    id: "execute",
    icon: "execute",
    title: "Execute through your stack",
    line: "After checks pass, automation runs via your connectors — same-origin proxies, your credentials.",
  },
  {
    id: "audit",
    icon: "audit",
    title: "Proof by default",
    line: "Approvals, executions, and status changes land in the audit trail — export when you need evidence.",
  },
  {
    id: "outro",
    icon: "outro",
    title: "Start at the hub",
    line: `Open ${SITE_BRAND_NAME}, route incidents to closure, and keep automation accountable.`,
  },
];

/** Paste into Runway, Veo, Sora-style tools — 45s corporate explainer, no logos assumed. */
export const PRODUCT_FILM_AI_PROMPT = `45-second minimal corporate explainer, dark UI aesthetic, soft cyan accent highlights on charcoal.
No readable trademarks. Abstract: alert pulse → single dashboard card → checklist morph → shield checkpoint → connector nodes → scrolling audit log lines → calm end frame with text "accountable operations".
Voiceover script (slow, clear):
1) When production signals fire, one incident record holds the story.
2) Teams align on runbooks and services in one console.
3) Automation is simulated first — dry-run before impact.
4) Approvals gate risky execution.
5) Connectors run work in your environment.
6) Every decision stays logged for audit.
Tone: confident, calm, engineering-focused. 16:9, subtle motion, no stock humans.`;
