type ApprovalPolicyEvaluation = {
  riskTier: "low" | "medium" | "high";
  requiresTwoPerson: boolean;
  requiresChangeWindow: boolean;
  blockedReason: string | null;
  normalizedPolicyHint: string;
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
