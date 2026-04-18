/**
 * Deterministic copilot when no cloud model or external reasoning URL is wired.
 * Copy is operator-safe (no env names, paths, or stack details).
 */
export function buildOfflineReply(
  lastUser: string,
  messages: { role: string; content: string }[],
): string {
  const lower = lastUser.toLowerCase();
  const depth = messages.filter((m) => m.role === "user").length;

  if (/openai|gpt|model|api key/.test(lower)) {
    return [
      "This workspace is using guided assistance — short operational nudges without an external model call.",
      "For deeper synthesis and drafting, an administrator can enable the full cloud model in your environment.",
      "You can keep triaging here; the checklist at the top of Copilot shows what’s connected.",
    ].join("\n\n");
  }

  if (/incident|outage|sev|on-?call|page/.test(lower)) {
    return [
      "**Triage sketch**",
      "1. Customer impact + blast radius",
      "2. Recent deploys / config / feature flags",
      "3. Dependencies & error budget",
      "4. Comms: status line + owner + next update",
      "",
      depth > 1
        ? "You’re building good context — next step is a tight timeline and a single owner per workstream."
        : "Want a draft customer-facing update? Ask for a status template.",
    ].join("\n");
  }

  if (/deploy|rollback|canary|release/.test(lower)) {
    return [
      "**Change safety**",
      "- Canary or staged rollout?",
      "- Automatic rollback criteria?",
      "- Who approves promote if risk is high? (see Approvals)",
      "",
      "When your team links an extended reasoning service, Copilot can align suggestions with your org policies.",
    ].join("\n");
  }

  if (/latency|slow|timeout|p99|error rate/.test(lower)) {
    return [
      "**Performance hunch list**",
      "- Compare deploy time vs regression start",
      "- Trace one slow path; check queue depth & saturation",
      "- Recent dependency version bumps?",
      "",
      "With a full model enabled, I can help turn these signals into a ranked hypothesis tree.",
    ].join("\n");
  }

  if (/hello|hi\b|hey/.test(lower)) {
    return [
      "Hey — I’m running in guided mode: concise operational checklists without calling an external model.",
      "Try: “we have a sev-2 on checkout” or “draft a rollback checklist.”",
      "Administrators can turn on the full cloud model when this workspace is ready.",
    ].join("\n\n");
  }

  return [
    `You said: “${lastUser.slice(0, 200)}${lastUser.length > 200 ? "…" : ""}”`,
    "",
    "I’m the **built-in assistant** — short SRE-style nudges until a cloud model is enabled for this deployment.",
    "",
    "**You can still:**",
    "- Work through incidents and runbooks in the console",
    "- Use Copilot for structured next-step prompts",
    "",
    "What system and symptom should we unpack?",
  ].join("\n");
}
