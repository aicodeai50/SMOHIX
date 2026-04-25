export type BlastRadius = "service" | "cluster" | "region" | "global";

export type DecisionPolicyCheck = {
  label: string;
  passed: boolean;
  note: string;
};

export type DecisionBrief = {
  riskScore: number;
  confidenceScore: number;
  blastRadius: BlastRadius;
  rollbackPlan: string;
  policyChecks: DecisionPolicyCheck[];
};

export type ExpectedOutcome = {
  summary: string;
  timeToStableMins: number;
  sideEffectsExpected: boolean;
};

export type ActualOutcome = {
  summary: string;
  timeToStableMins: number;
  rollbackUsed: boolean;
  sideEffectsDetected: boolean;
};

export type PolicySuggestion = {
  id: string;
  label: string;
  reason: string;
  confidenceScore: number;
  guardrails: string[];
};

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function buildDecisionBrief(input: {
  actionLabel: string;
  policyHint: string;
  rollbackPlan?: string;
}): DecisionBrief {
  const action = input.actionLabel.toLowerCase();
  const policy = input.policyHint.toLowerCase();

  let risk = 28;
  let confidence = 62;
  let blastRadius: BlastRadius = "service";

  if (hasAny(action, ["delete", "drop", "flush", "prod", "production", "rotate", "migrate"])) {
    risk += 30;
    confidence -= 8;
  }
  if (hasAny(action, ["region", "global", "all", "fleet", "cluster"])) {
    risk += 20;
    blastRadius = hasAny(action, ["global", "all"]) ? "global" : "region";
  } else if (action.includes("cluster")) {
    blastRadius = "cluster";
  }

  const hasTwoPerson = hasAny(policy, ["two-person", "two person", "2-person", "2 person"]);
  const hasWindow = hasAny(policy, ["change window", "window", "maintenance"]);
  const hasDryRun = hasAny(policy, ["dry-run", "dry run", "simulation", "simulated"]);
  const hasRollback = Boolean(input.rollbackPlan?.trim());

  if (hasTwoPerson) {
    risk -= 8;
    confidence += 10;
  }
  if (hasWindow) {
    risk -= 6;
    confidence += 8;
  }
  if (hasDryRun) {
    risk -= 10;
    confidence += 12;
  }
  if (!hasRollback) {
    risk += 14;
    confidence -= 10;
  } else {
    confidence += 8;
  }

  risk = clamp(risk, 5, 95);
  confidence = clamp(confidence, 10, 98);

  const policyChecks: DecisionPolicyCheck[] = [
    {
      label: "Two-person approval",
      passed: hasTwoPerson,
      note: hasTwoPerson ? "Declared in policy note." : "Missing explicit two-person rule.",
    },
    {
      label: "Change window",
      passed: hasWindow,
      note: hasWindow ? "Change window present." : "No explicit execution window.",
    },
    {
      label: "Dry-run evidence",
      passed: hasDryRun,
      note: hasDryRun ? "Dry-run/simulation requirement declared." : "Dry-run requirement not stated.",
    },
    {
      label: "Rollback plan",
      passed: hasRollback,
      note: hasRollback ? "Rollback plan captured." : "Rollback plan required.",
    },
  ];

  return {
    riskScore: risk,
    confidenceScore: confidence,
    blastRadius,
    rollbackPlan: input.rollbackPlan?.trim() || "Rollback plan not provided.",
    policyChecks,
  };
}

export function buildExpectedOutcome(input: {
  playbookId: string;
  decisionBrief: DecisionBrief;
}): ExpectedOutcome {
  const riskFactor = input.decisionBrief.riskScore / 100;
  const base = input.playbookId.includes("restart") ? 8 : 14;
  const timeToStableMins = Math.round(base + riskFactor * 18);
  return {
    summary: "Service impact should be contained within the declared blast radius.",
    timeToStableMins,
    sideEffectsExpected: input.decisionBrief.riskScore >= 70,
  };
}

export function buildActualOutcome(input: {
  ok: boolean;
  mode: "simulated" | "connector";
  expected: ExpectedOutcome;
}): ActualOutcome {
  if (!input.ok) {
    return {
      summary: "Execution failed and requires rollback validation.",
      timeToStableMins: input.expected.timeToStableMins + 30,
      rollbackUsed: true,
      sideEffectsDetected: true,
    };
  }
  const connectorPenalty = input.mode === "connector" ? 4 : 0;
  return {
    summary:
      input.mode === "connector"
        ? "Execution completed on connector target with expected safeguards."
        : "Simulation completed successfully without external side effects.",
    timeToStableMins: input.expected.timeToStableMins + connectorPenalty,
    rollbackUsed: false,
    sideEffectsDetected: false,
  };
}

export function decisionAccuracyScore(input: {
  expected: ExpectedOutcome;
  actual: ActualOutcome;
}): number {
  let score = 100;
  if (input.actual.rollbackUsed) score -= 30;
  if (input.actual.sideEffectsDetected && !input.expected.sideEffectsExpected) score -= 25;
  const drift = Math.abs(input.actual.timeToStableMins - input.expected.timeToStableMins);
  score -= Math.min(25, drift);
  return clamp(score, 0, 100);
}

export function suggestPolicyPromotions(input: {
  playbookId: string;
  decisionBrief: DecisionBrief;
  accuracyScore: number;
}): PolicySuggestion[] {
  if (input.accuracyScore < 75 || input.decisionBrief.confidenceScore < 70) {
    return [];
  }
  const idBase = `${input.playbookId}-${input.decisionBrief.blastRadius}`;
  return [
    {
      id: `${idBase}-auto-approve`,
      label: "Candidate: conditional auto-approval",
      reason:
        "Repeated guarded executions show strong confidence and consistent outcomes for this scope.",
      confidenceScore: clamp(
        Math.round((input.accuracyScore + input.decisionBrief.confidenceScore) / 2),
        0,
        99,
      ),
      guardrails: [
        "Require successful dry-run within 2h",
        "Enforce change window",
        "Limit to declared blast radius",
      ],
    },
  ];
}
