import type { BlastRadius, DecisionBrief } from "@/lib/decision-intelligence";

type RiskTier = "low" | "medium" | "high" | "critical";

export type ChangeRiskAssessment = {
  score: number;
  tier: RiskTier;
  factors: string[];
  requiresSeniorApproval: boolean;
};

const BLAST_RADIUS_WEIGHT: Record<BlastRadius, number> = {
  service: 0,
  cluster: 8,
  region: 16,
  global: 24,
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function hasToken(haystack: string, tokens: string[]): boolean {
  return tokens.some((t) => haystack.includes(t));
}

function riskTierFromScore(score: number): RiskTier {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function assessChangeRisk(input: {
  playbook: { env: "staging" | "production"; risk: "low" | "high"; name: string };
  decisionBrief: DecisionBrief;
  approvalNote: string;
  hasIncidentLinked: boolean;
}): ChangeRiskAssessment {
  const factors: string[] = [];
  let score = input.decisionBrief.riskScore;

  if (input.playbook.env === "production") {
    score += 14;
    factors.push("production environment");
  }
  if (input.playbook.risk === "high") {
    score += 10;
    factors.push("high-risk playbook profile");
  }

  score += BLAST_RADIUS_WEIGHT[input.decisionBrief.blastRadius];
  if (BLAST_RADIUS_WEIGHT[input.decisionBrief.blastRadius] > 0) {
    factors.push(`blast radius ${input.decisionBrief.blastRadius}`);
  }

  const note = input.approvalNote.toLowerCase();
  const hasTwoPerson = hasToken(note, ["two-person", "two person", "2-person", "2 person"]);
  const hasWindow = hasToken(note, ["change window", "maintenance window"]);
  const hasSenior = hasToken(note, ["senior", "principal", "staff on-call", "staff oncall"]);

  if (!hasTwoPerson) {
    score += 8;
    factors.push("missing explicit two-person approval note");
  }
  if (!hasWindow) {
    score += 6;
    factors.push("missing explicit change window note");
  }
  if (!input.hasIncidentLinked) {
    score += 4;
    factors.push("no linked incident context");
  }

  score = clamp(score);
  const tier = riskTierFromScore(score);
  const requiresSeniorApproval = score >= 80;
  if (requiresSeniorApproval && !hasSenior) {
    factors.push("critical risk requires senior-on-call acknowledgement in approval note");
  }

  if (factors.length === 0) {
    factors.push("guardrails and execution context are within expected thresholds");
  }

  return {
    score,
    tier,
    factors,
    requiresSeniorApproval,
  };
}

export function evaluateChangeRiskApprovalTightening(input: {
  assessment: ChangeRiskAssessment;
  approvalNote: string;
}): string | null {
  const note = input.approvalNote.toLowerCase();
  const hasSeniorToken = hasToken(note, ["senior", "principal", "staff on-call", "staff oncall"]);
  if (input.assessment.requiresSeniorApproval && !hasSeniorToken) {
    return "Execution blocked: critical change risk requires senior-on-call acknowledgement in approval note.";
  }
  return null;
}
