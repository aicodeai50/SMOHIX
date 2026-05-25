export const CONSOLE_AMBIENT_STATUS_VERSION = "zentro-console-ambient-status/1";

export type ConsoleAmbientHealth = "nominal" | "attention" | "critical";

export type ConsoleAmbientPhase = {
  label: string;
  value: string;
};

export type ConsoleAmbientSnapshot = {
  version: typeof CONSOLE_AMBIENT_STATUS_VERSION;
  generatedAt: string;
  health: ConsoleAmbientHealth;
  headline: string;
  phases: ConsoleAmbientPhase[];
};

export function classifyConsoleAmbientHealth(input: {
  hotIncidents: number;
  openIncidents: number;
  pendingApprovals: number;
  criticalBurnServices: number;
  connectorsConfigured: number;
  connectorsUp: number;
}): ConsoleAmbientHealth {
  if (
    input.hotIncidents > 0 ||
    input.criticalBurnServices > 0 ||
    (input.connectorsConfigured > 0 && input.connectorsUp === 0)
  ) {
    return "critical";
  }
  if (input.openIncidents > 0 || input.pendingApprovals > 0) {
    return "attention";
  }
  return "nominal";
}

export function consoleAmbientHeadline(health: ConsoleAmbientHealth): string {
  if (health === "critical") return "Critical signals require response";
  if (health === "attention") return "Active workload — review queue and incidents";
  return "Operational posture nominal";
}

export function buildConsoleAmbientSnapshot(input: {
  openIncidents: number;
  hotIncidents: number;
  totalIncidents: number;
  pendingApprovals: number;
  connectorsUp: number;
  connectorsConfigured: number;
  dryRunSuccessRate: number;
  dryRunCount: number;
  criticalBurnServices: number;
  signedIn: boolean;
  generatedAt?: string;
}): ConsoleAmbientSnapshot {
  const health = classifyConsoleAmbientHealth({
    hotIncidents: input.hotIncidents,
    openIncidents: input.openIncidents,
    pendingApprovals: input.pendingApprovals,
    criticalBurnServices: input.criticalBurnServices,
    connectorsConfigured: input.connectorsConfigured,
    connectorsUp: input.connectorsUp,
  });

  const phases: ConsoleAmbientPhase[] = input.signedIn
    ? [
        {
          label: "INCIDENTS",
          value: `${input.openIncidents} open · ${input.totalIncidents} total`,
        },
        {
          label: "APPROVALS",
          value: input.pendingApprovals > 0 ? `${input.pendingApprovals} pending` : "queue clear",
        },
        {
          label: "CONNECTORS",
          value:
            input.connectorsConfigured === 0
              ? "none configured"
              : `${input.connectorsUp}/${input.connectorsConfigured} healthy`,
        },
        {
          label: "DRY-RUNS",
          value:
            input.dryRunCount > 0 ? `${input.dryRunSuccessRate}% success` : "no runs yet",
        },
        {
          label: "GUARDRAILS",
          value: input.signedIn ? "policy enforced" : "local session",
        },
        { label: "AUDIT", value: "append-only" },
      ]
    : [
        { label: "MODE", value: "LOCAL SESSION" },
        { label: "ACCOUNTS", value: "optional sign-in" },
        { label: "GUARDRAILS", value: "dry-run first" },
        { label: "AUDIT", value: "session trail" },
      ];

  return {
    version: CONSOLE_AMBIENT_STATUS_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    health,
    headline: consoleAmbientHeadline(health),
    phases,
  };
}
