/**
 * Deterministic “alive” copilot when no OpenAI key or external reasoning URL is wired.
 * Keeps the product usable before Supabase / Lemon / custom backends.
 */
export function buildOfflineReply(
  lastUser: string,
  messages: { role: string; content: string }[],
): string {
  const lower = lastUser.toLowerCase();
  const depth = messages.filter((m) => m.role === "user").length;

  if (/openai|gpt|model|api key/.test(lower)) {
    return [
      "To power this chat with OpenAI, set **OPENAI_API_KEY** (server-only) in `.env.local` and restart.",
      "Optional: **OPENAI_CHAT_MODEL** (default `gpt-4o-mini`).",
      "The UI posts to `/api/copilot/chat`, which prefers OpenAI, then falls back to this offline brain.",
    ].join("\n\n");
  }

  if (/incident|outage|sev|on-?call|page/.test(lower)) {
    return [
      "**Triage sketch (offline mode)**",
      "1. Customer impact + blast radius",
      "2. Recent deploys / config / feature flags",
      "3. Dependencies & error budget",
      "4. Comms: status line + owner + next update",
      "",
      depth > 1
        ? "You’re building context — next step is a tight timeline. Add OPENAI_API_KEY for deeper synthesis."
        : "Want a draft customer-facing update? Ask “status template”.",
    ].join("\n");
  }

  if (/deploy|rollback|canary|release/.test(lower)) {
    return [
      "**Change safety (offline mode)**",
      "- Canary or staged rollout?",
      "- Automatic rollback criteria?",
      "- Who approves promote if risk is high? (see Approvals)",
      "",
      "Connect your reasoning service via **SHYNVO_REASONING_API_URL** when you’re ready to centralize policy.",
    ].join("\n");
  }

  if (/latency|slow|timeout|p99|error rate/.test(lower)) {
    return [
      "**Performance hunch list**",
      "- Compare deploy time vs regression start",
      "- Trace one slow path; check queue depth & saturation",
      "- Recent dependency version bumps?",
      "",
      "I’m running offline — with **OPENAI_API_KEY** I can help you turn metrics into a hypothesis tree.",
    ].join("\n");
  }

  if (/hello|hi\b|hey/.test(lower)) {
    return [
      "Hey — Shynvo copilot is **live** in offline mode: short operational guidance, no external calls.",
      "Try: “we have a sev-2 on checkout” or “draft a rollback checklist”.",
      "Add **OPENAI_API_KEY** for full GPT reasoning on the same endpoint (`/api/copilot/chat`).",
    ].join("\n\n");
  }

  return [
    `You said: “${lastUser.slice(0, 200)}${lastUser.length > 200 ? "…" : ""}”`,
    "",
    "I’m the **built-in offline copilot** — concise SRE-style nudges, no model API yet.",
    "",
    "**Power up:**",
    "- Set **OPENAI_API_KEY** → GPT on `/api/copilot/chat`",
    "- Or set **SHYNVO_REASONING_API_URL** → forward `/api/reasoning/*` to your stack",
    "",
    "What system and symptom should we unpack?",
  ].join("\n");
}
