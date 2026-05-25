export const CONSOLE_AMBIENT_STATUS_VERSION = "zentro-console-ambient-status/1";

export type ConsoleAmbientContext = "default" | "incidents" | "approvals" | "services";

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

export type ConsoleAmbientCounts = {
  openIncidents?: number;
  hotIncidents?: number;
  pendingApprovals?: number;
  pendingHighRisk?: number;
  pendingPolicyGaps?: number;
  totalServices?: number;
  servicesWithSlo?: number;
  criticalBurnServices?: number;
  warningBurnServices?: number;
};

export function classifyConsoleAmbientHealthForContext(
  input: {
    hotIncidents: number;
    openIncidents: number;
    pendingApprovals: number;
    criticalBurnServices: number;
    connectorsConfigured: number;
    connectorsUp: number;
    pendingHighRisk?: number;
    pendingPolicyGaps?: number;
    warningBurnServices?: number;
  },
  context: ConsoleAmbientContext = "default",
): ConsoleAmbientHealth {
  if (context === "services") {
    if (
      input.criticalBurnServices > 0 ||
      (input.connectorsConfigured > 0 && input.connectorsUp === 0)
    ) {
      return "critical";
    }
    if ((input.warningBurnServices ?? 0) > 0) {
      return "attention";
    }
    return "nominal";
  }
  if (context === "approvals") {
    if ((input.pendingHighRisk ?? 0) > 0 || (input.pendingPolicyGaps ?? 0) > 0) {
      return "critical";
    }
    if (input.pendingApprovals > 0) {
      return "attention";
    }
    return "nominal";
  }
  return classifyConsoleAmbientHealth(input);
}

export function consoleAmbientHeadline(
  health: ConsoleAmbientHealth,
  context: ConsoleAmbientContext = "default",
  counts?: ConsoleAmbientCounts,
): string {
  if (context === "services") {
    const critical = counts?.criticalBurnServices ?? 0;
    const warning = counts?.warningBurnServices ?? 0;
    const catalog = counts?.totalServices ?? 0;
    if (health === "critical") {
      if (critical > 0) {
        return `${critical} service${critical === 1 ? "" : "s"} in critical error budget burn`;
      }
      return "Connector health critical — alert ingest may be impaired";
    }
    if (health === "attention") {
      return warning > 0
        ? `${warning} service${warning === 1 ? "" : "s"} at warning burn — review SLO posture`
        : "Review service catalog, SLO targets, and dependency edges";
    }
    return catalog > 0
      ? "Service catalog healthy — SLOs within budget"
      : "Add services to the catalog and wire alert ingest";
  }
  if (context === "approvals") {
    const pending = counts?.pendingApprovals ?? 0;
    const highRisk = counts?.pendingHighRisk ?? 0;
    const policyGaps = counts?.pendingPolicyGaps ?? 0;
    if (health === "critical") {
      if (highRisk > 0) {
        return `${highRisk} high-risk approval${highRisk === 1 ? "" : "s"} need immediate review`;
      }
      if (policyGaps > 0) {
        return `${policyGaps} pending request${policyGaps === 1 ? "" : "s"} missing policy checks`;
      }
      return "Critical approval signals require response";
    }
    if (health === "attention") {
      return pending > 0
        ? `${pending} approval${pending === 1 ? "" : "s"} awaiting human decision`
        : "Review pending change requests and guardrails";
    }
    return "Approval queue clear — guardrails enforced";
  }
  if (context === "incidents") {
    if (health === "critical") {
      const hot = counts?.hotIncidents ?? 0;
      return hot > 0
        ? `${hot} critical/high incident${hot === 1 ? "" : "s"} need immediate triage`
        : "Critical incident signals require response";
    }
    if (health === "attention") {
      const open = counts?.openIncidents ?? 0;
      return open > 0
        ? `${open} open incident${open === 1 ? "" : "s"} in the response queue`
        : "Active incident workload — review timelines and ownership";
    }
    return "Incident queue clear — no active response workload";
  }
  if (health === "critical") return "Critical signals require response";
  if (health === "attention") return "Active workload — review queue and incidents";
  return "Operational posture nominal";
}

export function approvalAmbientMetrics(
  pending: readonly {
    decisionBrief: {
      riskScore: number;
      policyChecks: readonly { passed: boolean }[];
    };
  }[],
): {
  pendingApprovals: number;
  pendingHighRisk: number;
  pendingPolicyGaps: number;
} {
  return {
    pendingApprovals: pending.length,
    pendingHighRisk: pending.filter((p) => p.decisionBrief.riskScore >= 70).length,
    pendingPolicyGaps: pending.filter((p) =>
      p.decisionBrief.policyChecks.some((check) => !check.passed),
    ).length,
  };
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
  context?: ConsoleAmbientContext;
  pendingHighRisk?: number;
  pendingPolicyGaps?: number;
  warningBurnServices?: number;
  totalServices?: number;
  servicesWithSlo?: number;
  generatedAt?: string;
}): ConsoleAmbientSnapshot {
  const context = input.context ?? "default";
  const health = classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: input.hotIncidents,
      openIncidents: input.openIncidents,
      pendingApprovals: input.pendingApprovals,
      criticalBurnServices: input.criticalBurnServices,
      connectorsConfigured: input.connectorsConfigured,
      connectorsUp: input.connectorsUp,
      pendingHighRisk: input.pendingHighRisk,
      pendingPolicyGaps: input.pendingPolicyGaps,
      warningBurnServices: input.warningBurnServices,
    },
    context,
  );

  const sloPhaseValue =
    input.criticalBurnServices > 0
      ? `${input.criticalBurnServices} critical${(input.warningBurnServices ?? 0) > 0 ? ` · ${input.warningBurnServices} warning` : ""}`
      : (input.warningBurnServices ?? 0) > 0
        ? `${input.warningBurnServices} warning`
        : (input.servicesWithSlo ?? 0) > 0
          ? `${input.servicesWithSlo} SLO-covered · within budget`
          : "no SLOs configured";

  const approvalPhaseValue =
    input.pendingApprovals > 0
      ? input.pendingHighRisk && input.pendingHighRisk > 0
        ? `${input.pendingApprovals} pending · ${input.pendingHighRisk} high-risk`
        : input.pendingPolicyGaps && input.pendingPolicyGaps > 0
          ? `${input.pendingApprovals} pending · ${input.pendingPolicyGaps} policy gap${input.pendingPolicyGaps === 1 ? "" : "s"}`
          : `${input.pendingApprovals} pending`
      : "queue clear";

  const signedInPhases: ConsoleAmbientPhase[] = [
    {
      label: "INCIDENTS",
      value:
        input.hotIncidents > 0
          ? `${input.hotIncidents} hot · ${input.openIncidents} open`
          : `${input.openIncidents} open · ${input.totalIncidents} total`,
    },
    {
      label: "APPROVALS",
      value: approvalPhaseValue,
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
      value: input.dryRunCount > 0 ? `${input.dryRunSuccessRate}% success` : "no runs yet",
    },
    {
      label: "GUARDRAILS",
      value: input.signedIn ? "policy enforced" : "local session",
    },
    { label: "AUDIT", value: "append-only" },
  ];

  const phases: ConsoleAmbientPhase[] = input.signedIn
    ? context === "services"
      ? [
          { label: "SLO BURN", value: sloPhaseValue },
          signedInPhases[2]!,
          {
            label: "CATALOG",
            value: `${input.totalServices ?? 0} service${input.totalServices === 1 ? "" : "s"}`,
          },
          signedInPhases[0]!,
          signedInPhases[1]!,
          signedInPhases[5]!,
        ]
      : context === "approvals"
      ? [
          signedInPhases[1]!,
          { label: "GUARDRAILS", value: signedInPhases[4]!.value },
          signedInPhases[0]!,
          signedInPhases[2]!,
          signedInPhases[3]!,
          signedInPhases[5]!,
        ]
      : signedInPhases
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
    headline: consoleAmbientHeadline(health, context, {
      openIncidents: input.openIncidents,
      hotIncidents: input.hotIncidents,
      pendingApprovals: input.pendingApprovals,
      pendingHighRisk: input.pendingHighRisk,
      pendingPolicyGaps: input.pendingPolicyGaps,
      totalServices: input.totalServices,
      servicesWithSlo: input.servicesWithSlo,
      criticalBurnServices: input.criticalBurnServices,
      warningBurnServices: input.warningBurnServices,
    }),
    phases,
  };
}
