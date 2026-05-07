type ApprovalPolicyEvaluation = {
  riskTier: "low" | "medium" | "high";
  requiresTwoPerson: boolean;
  requiresChangeWindow: boolean;
  blockedReason: string | null;
  normalizedPolicyHint: string;
};

type BlastRadius = "service" | "cluster" | "region" | "global";
type EnforcedGuardrails = {
  requireDryRunFresh: boolean;
  requireChangeWindow: boolean;
  maxBlastRadius: BlastRadius | null;
};
type EnforcementEvaluation = {
  blockedReason: string | null;
  checks: {
    dryRunFresh: boolean;
    changeWindow: boolean;
    blastRadiusAllowed: boolean;
  };
};

export type ApprovalNoteSignals = {
  hasChangeWindow: boolean;
  hasSeniorAcknowledgement: boolean;
  hasTwoPersonApproval: boolean;
};

export const SLO_BURN_POLICY_BLOCKED_REASON =
  "Execution blocked by SLO burn policy: critical burn state requires senior acknowledgement and explicit change window in approval note.";

const HIGH_RISK_KEYWORDS = [
  "production",
  "prod",
  "delete",
  "drop",
  "failover",
  "database",
  "rotate",
  "rotation",
  "firewall",
  "revoke",
  "shutdown",
];

function hasAnyKeyword(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

export function parseApprovalNoteSignals(approvalNote: string): ApprovalNoteSignals {
  const note = approvalNote.trim().toLowerCase();
  return {
    hasChangeWindow: note.includes("change window") || note.includes("maintenance window"),
    hasSeniorAcknowledgement:
      note.includes("senior") || note.includes("principal") || note.includes("staff on-call"),
    hasTwoPersonApproval:
      note.includes("two-person") ||
      note.includes("two person") ||
      note.includes("2-person") ||
      note.includes("2 person"),
  };
}

export function isSloBurnPolicyBlockedReason(reason: string | null | undefined): boolean {
  return String(reason ?? "").trim() === SLO_BURN_POLICY_BLOCKED_REASON;
}

export function evaluateApprovalPolicy(
  actionLabel: string,
  policyHint: string,
): ApprovalPolicyEvaluation {
  const action = actionLabel.trim().toLowerCase();
  const policy = policyHint.trim().toLowerCase();
  const combined = `${action} ${policy}`.trim();

  const risky = hasAnyKeyword(combined, HIGH_RISK_KEYWORDS);
  const requiresTwoPerson =
    risky ||
    policy.includes("two-person") ||
    policy.includes("two person") ||
    policy.includes("2-person") ||
    policy.includes("2 person");
  const requiresChangeWindow =
    risky || policy.includes("change window") || policy.includes("maintenance window");

  const signals = parseApprovalNoteSignals(policyHint);
  const hasTwoPersonCommitment = signals.hasTwoPersonApproval;
  const hasWindowCommitment = signals.hasChangeWindow;

  let riskTier: ApprovalPolicyEvaluation["riskTier"] = "low";
  if (risky) {
    riskTier = "high";
  } else if (action.includes("restart") || action.includes("deploy")) {
    riskTier = "medium";
  }

  let blockedReason: string | null = null;
  if (risky && (!hasTwoPersonCommitment || !hasWindowCommitment)) {
    blockedReason =
      "High-risk actions require policy hints including both two-person approval and a change window.";
  }

  const normalizedPolicyParts = [
    policyHint.trim() || null,
    `risk:${riskTier}`,
    requiresTwoPerson ? "requires:two-person" : null,
    requiresChangeWindow ? "requires:change-window" : null,
  ].filter(Boolean);

  return {
    riskTier,
    requiresTwoPerson,
    requiresChangeWindow,
    blockedReason,
    normalizedPolicyHint: normalizedPolicyParts.join(" | "),
  };
}

const RADIUS_RANK: Record<BlastRadius, number> = {
  service: 1,
  cluster: 2,
  region: 3,
  global: 4,
};

export function evaluateAcceptedPolicyEnforcement(input: {
  approvalNote: string;
  decisionBlastRadius: BlastRadius;
  hasFreshDryRun: boolean;
  enforced: EnforcedGuardrails | null;
}): EnforcementEvaluation {
  const e = input.enforced;
  if (!e) {
    return {
      blockedReason: null,
      checks: { dryRunFresh: true, changeWindow: true, blastRadiusAllowed: true },
    };
  }
  const signals = parseApprovalNoteSignals(input.approvalNote);
  const hasWindow = signals.hasChangeWindow;
  const blastAllowed = e.maxBlastRadius
    ? RADIUS_RANK[input.decisionBlastRadius] <= RADIUS_RANK[e.maxBlastRadius]
    : true;
  const dryRunOk = e.requireDryRunFresh ? input.hasFreshDryRun : true;
  const windowOk = e.requireChangeWindow ? hasWindow : true;

  let blockedReason: string | null = null;
  if (!dryRunOk) {
    blockedReason = "Execution blocked by accepted policy: requires a fresh successful dry-run.";
  } else if (!windowOk) {
    blockedReason =
      "Execution blocked by accepted policy: approval note must include an explicit change window.";
  } else if (!blastAllowed) {
    blockedReason =
      "Execution blocked by accepted policy: requested blast radius exceeds accepted policy scope.";
  }

  return {
    blockedReason,
    checks: {
      dryRunFresh: dryRunOk,
      changeWindow: windowOk,
      blastRadiusAllowed: blastAllowed,
    },
  };
}
