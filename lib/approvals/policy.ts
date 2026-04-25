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

  const hasTwoPersonCommitment =
    policy.includes("two-person") ||
    policy.includes("two person") ||
    policy.includes("2-person") ||
    policy.includes("2 person");
  const hasWindowCommitment =
    policy.includes("change window") || policy.includes("maintenance window");

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
  const note = input.approvalNote.toLowerCase();
  const hasWindow = note.includes("change window") || note.includes("maintenance window");
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
