export type ExecutionOutcomeKind = "safe" | "review" | "blocked";

export type ExecutionOutcomeTone = "neutral" | "info" | "warn" | "success" | "danger" | "muted";

/**
 * Maps dry-run robot health + simulation state to operator-facing decision labels.
 */
export function dryRunOutcomePresentation(
  ok: boolean,
  robotConfigured: boolean,
): { kind: ExecutionOutcomeKind; label: string; tone: ExecutionOutcomeTone } {
  if (!ok) {
    if (robotConfigured) {
      return { kind: "blocked", label: "Blocked", tone: "danger" };
    }
    return { kind: "review", label: "Requires review", tone: "warn" };
  }
  if (robotConfigured) {
    return { kind: "safe", label: "Safe to execute", tone: "success" };
  }
  return { kind: "review", label: "Requires review", tone: "warn" };
}
