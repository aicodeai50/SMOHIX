export type PolicyBlockReasonCode =
  | "dry_run_fresh_required"
  | "change_window_required"
  | "blast_radius_exceeded"
  | "unknown";

export function policyBlockReasonCodeFromMessage(message: string): PolicyBlockReasonCode {
  const m = message.toLowerCase();
  if (m.includes("fresh successful dry-run")) return "dry_run_fresh_required";
  if (m.includes("explicit change window")) return "change_window_required";
  if (m.includes("blast radius exceeds")) return "blast_radius_exceeded";
  return "unknown";
}

export function policyBlockReasonLabel(code: PolicyBlockReasonCode): string {
  if (code === "dry_run_fresh_required") return "Fresh dry-run required";
  if (code === "change_window_required") return "Change window missing";
  if (code === "blast_radius_exceeded") return "Blast radius exceeds policy";
  return "Unknown policy block";
}

export function policySuggestedReviewerNote(code: PolicyBlockReasonCode): string {
  if (code === "dry_run_fresh_required") {
    return "Enforce fresh successful dry-run within 2h before execution.";
  }
  if (code === "change_window_required") {
    return "Enforce explicit change window in approval note for execution.";
  }
  if (code === "blast_radius_exceeded") {
    return "Enforce blast radius cap. Example: max-blast: region";
  }
  return "Review enforcement checks and define explicit guardrails.";
}
