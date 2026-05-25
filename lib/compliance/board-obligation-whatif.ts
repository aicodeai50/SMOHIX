import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildBoardObligationForecastFromItems,
  type BoardObligationForecastPack,
} from "@/lib/compliance/board-obligation-forecast";
import {
  evaluateObligationDensityBreaches,
  getObligationDensityAlertOrgSettings,
  type ObligationDensityAlertOrgSettings,
} from "@/lib/compliance/obligation-density-alerting";
import { buildControlTestingSchedulesPack } from "@/lib/compliance/control-testing-schedules";
import { buildGrcComplianceCalendar } from "@/lib/compliance/grc-calendar";
import { listAssessorEvidenceRequests } from "@/lib/compliance/assessor-evidence-requests";
import {
  classifyObligationUrgency,
  collectRegulatoryObligationItems,
  type RegulatoryObligationItem,
} from "@/lib/compliance/regulatory-obligation-heatmap";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const BOARD_OBLIGATION_WHATIF_VERSION = "zentro-board-obligation-whatif/1";

export const DEFAULT_WHATIF_HORIZON_DAYS = 90;

export type ObligationWhatIfScenario = {
  id: string;
  title: string;
  summary: string;
  shiftWeeks: number;
  excludedFrameworks: ComplianceFramework[];
  excludeVendorObligations: boolean;
};

export const OBLIGATION_WHATIF_SCENARIOS: ObligationWhatIfScenario[] = [
  {
    id: "defer-2w",
    title: "Defer all obligations 2 weeks",
    summary:
      "Slides every open obligation due date forward two weeks to model audit-season slip without descoping frameworks.",
    shiftWeeks: 2,
    excludedFrameworks: [],
    excludeVendorObligations: false,
  },
  {
    id: "defer-4w",
    title: "Defer all obligations 4 weeks",
    summary:
      "Stress-tests a one-month program slip — peak week density and current-week overload vs baseline.",
    shiftWeeks: 4,
    excludedFrameworks: [],
    excludeVendorObligations: false,
  },
  {
    id: "descope-pci-hipaa",
    title: "Descope PCI DSS and HIPAA",
    summary:
      "Removes payment-card and healthcare safeguard obligations from the forecast while other frameworks remain in scope.",
    shiftWeeks: 0,
    excludedFrameworks: ["pcidss", "hipaa"],
    excludeVendorObligations: false,
  },
  {
    id: "descope-gdpr-cmmc",
    title: "Descope GDPR Art. 32 and CMMC L2",
    summary:
      "Models exiting EU technical-measures and defense-supply-chain overlay packs from the obligation queue.",
    shiftWeeks: 0,
    excludedFrameworks: ["gdpr_art32", "cmmc_l2"],
    excludeVendorObligations: false,
  },
  {
    id: "defer-2w-vendor-slim",
    title: "Defer 2 weeks + drop vendor calendar load",
    summary:
      "Combines a two-week shift with vendor-tier calendar obligations removed to reduce third-party review clustering.",
    shiftWeeks: 2,
    excludedFrameworks: [],
    excludeVendorObligations: true,
  },
];

export type ObligationWhatIfResult = {
  scenario: ObligationWhatIfScenario;
  simulated: BoardObligationForecastPack;
  peakWeekDelta: number;
  currentWeekDelta: number;
  totalObligationsDelta: number;
  currentOverdueDelta: number;
  breachCountDelta: number;
  simulatedBreachCount: number;
  capacityNote: string;
};

export type BoardObligationWhatIfPack = {
  version: typeof BOARD_OBLIGATION_WHATIF_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  settings: ObligationDensityAlertOrgSettings;
  baseline: BoardObligationForecastPack;
  baselineBreachCount: number;
  scenarios: ObligationWhatIfScenario[];
  results: ObligationWhatIfResult[];
  bestReliefScenarioId: string | null;
  highestPeakScenarioId: string | null;
};

export function applyObligationWhatIfScenario(
  items: RegulatoryObligationItem[],
  scenario: ObligationWhatIfScenario,
  now = new Date(),
): RegulatoryObligationItem[] {
  let filtered = items;

  if (scenario.excludedFrameworks.length > 0) {
    const excluded = new Set(scenario.excludedFrameworks);
    filtered = filtered.filter(
      (i) => !i.framework || !excluded.has(i.framework),
    );
  }

  if (scenario.excludeVendorObligations) {
    filtered = filtered.filter((i) => i.dimension !== "vendor");
  }

  if (scenario.shiftWeeks === 0) {
    return filtered.map((i) => ({ ...i }));
  }

  return filtered.map((item) => {
    const d = new Date(item.dueAt);
    d.setUTCDate(d.getUTCDate() + scenario.shiftWeeks * 7);
    const dueAt = d.toISOString();
    const urgency = classifyObligationUrgency(dueAt, now);
    return {
      ...item,
      dueAt,
      urgency,
      statusLabel: urgency,
    };
  });
}

export function simulateObligationWhatIfScenario(input: {
  scenario: ObligationWhatIfScenario;
  items: RegulatoryObligationItem[];
  orgId: string | null;
  horizonDays: number;
  settings: ObligationDensityAlertOrgSettings;
  baseline: BoardObligationForecastPack;
  baselineBreachCount: number;
  now?: Date;
}): ObligationWhatIfResult {
  const now = input.now ?? new Date();
  const modified = applyObligationWhatIfScenario(input.items, input.scenario, now);
  const simulated = buildBoardObligationForecastFromItems({
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    items: modified,
    now,
  });

  const simulatedBreaches = evaluateObligationDensityBreaches({
    forecast: simulated,
    settings: input.settings,
  });

  const baselineCurrent =
    input.baseline.buckets.find((b) => b.isCurrentWeek)?.totalCount ?? 0;
  const simulatedCurrent =
    simulated.buckets.find((b) => b.isCurrentWeek)?.totalCount ?? 0;

  const peakWeekDelta = simulated.peakWeekCount - input.baseline.peakWeekCount;
  const currentWeekDelta = simulatedCurrent - baselineCurrent;
  const totalObligationsDelta =
    simulated.totalForecastObligations - input.baseline.totalForecastObligations;
  const currentOverdueDelta =
    simulated.currentOverdue - input.baseline.currentOverdue;
  const breachCountDelta = simulatedBreaches.length - input.baselineBreachCount;

  let capacityNote: string;
  if (peakWeekDelta < 0 && breachCountDelta <= 0) {
    capacityNote = `Peak week drops by ${Math.abs(peakWeekDelta)} obligations; density alert breaches ${breachCountDelta === 0 ? "unchanged" : `reduced by ${Math.abs(breachCountDelta)}`}.`;
  } else if (peakWeekDelta > 0) {
    capacityNote = `Peak week rises by ${peakWeekDelta} — committee capacity may need reinforcement.`;
  } else if (totalObligationsDelta < 0) {
    capacityNote = `${Math.abs(totalObligationsDelta)} fewer obligations in horizon; peak week unchanged at ${simulated.peakWeekCount}.`;
  } else {
    capacityNote = "Forecast density similar to baseline — limited capacity relief.";
  }

  return {
    scenario: input.scenario,
    simulated,
    peakWeekDelta,
    currentWeekDelta,
    totalObligationsDelta,
    currentOverdueDelta,
    breachCountDelta,
    simulatedBreachCount: simulatedBreaches.length,
    capacityNote,
  };
}

export function buildBoardObligationWhatIfFromParts(input: {
  orgId: string | null;
  horizonDays: number;
  items: RegulatoryObligationItem[];
  settings: ObligationDensityAlertOrgSettings;
  scenarios?: ObligationWhatIfScenario[];
  now?: Date;
  generatedAt?: string;
}): BoardObligationWhatIfPack {
  const now = input.now ?? new Date();
  const scenarios = input.scenarios ?? OBLIGATION_WHATIF_SCENARIOS;

  const baseline = buildBoardObligationForecastFromItems({
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    items: input.items,
    now,
  });

  const baselineBreaches = evaluateObligationDensityBreaches({
    forecast: baseline,
    settings: input.settings,
  });

  const results = scenarios
    .map((scenario) =>
      simulateObligationWhatIfScenario({
        scenario,
        items: input.items,
        orgId: input.orgId,
        horizonDays: input.horizonDays,
        settings: input.settings,
        baseline,
        baselineBreachCount: baselineBreaches.length,
        now,
      }),
    )
    .sort((a, b) => a.peakWeekDelta - b.peakWeekDelta || a.totalObligationsDelta - b.totalObligationsDelta);

  const bestRelief = results.find((r) => r.peakWeekDelta < 0) ?? results[0];
  const highestPeak = [...results].sort((a, b) => b.simulated.peakWeekCount - a.simulated.peakWeekCount)[0];

  return {
    version: BOARD_OBLIGATION_WHATIF_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    settings: input.settings,
    baseline,
    baselineBreachCount: baselineBreaches.length,
    scenarios,
    results,
    bestReliefScenarioId: bestRelief?.scenario.id ?? null,
    highestPeakScenarioId: highestPeak?.scenario.id ?? null,
  };
}

export async function buildBoardObligationWhatIfPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    scenarios?: ObligationWhatIfScenario[];
    supabase?: SupabaseClient;
  },
): Promise<BoardObligationWhatIfPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? DEFAULT_WHATIF_HORIZON_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [calendar, testing, evidenceRequests, settings] = await Promise.all([
    buildGrcComplianceCalendar(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildControlTestingSchedulesPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    listAssessorEvidenceRequests(opts.orgId, supabase),
    getObligationDensityAlertOrgSettings(opts.orgId, supabase),
  ]);

  const items = collectRegulatoryObligationItems({
    calendar,
    testing,
    evidenceRequests,
    horizonDays,
  });

  return buildBoardObligationWhatIfFromParts({
    orgId: opts.orgId,
    horizonDays,
    items,
    settings,
    scenarios: opts.scenarios,
  });
}

export function parseWhatIfFrameworksParam(raw: string | null): ComplianceFramework[] {
  if (!raw?.trim()) return [];
  const allowed = new Set<ComplianceFramework>([
    "soc2",
    "iso27001",
    "pcidss",
    "hipaa",
    "nist_csf",
    "cis_v8",
    "cmmc_l2",
    "gdpr_art32",
  ]);
  return raw
    .split(",")
    .map((s) => s.trim() as ComplianceFramework)
    .filter((fw) => allowed.has(fw));
}

export function buildCustomWhatIfScenario(input: {
  shiftWeeks: number;
  excludedFrameworks: ComplianceFramework[];
  excludeVendor: boolean;
}): ObligationWhatIfScenario {
  const parts: string[] = [];
  if (input.shiftWeeks > 0) parts.push(`+${input.shiftWeeks}w shift`);
  if (input.excludedFrameworks.length > 0) {
    parts.push(`exclude ${input.excludedFrameworks.join(", ")}`);
  }
  if (input.excludeVendor) parts.push("no vendor calendar");
  const label = parts.length > 0 ? parts.join(" · ") : "custom";

  return {
    id: "custom",
    title: `Custom scenario (${label})`,
    summary: "Ad-hoc what-if from API query parameters.",
    shiftWeeks: Math.max(0, Math.min(12, input.shiftWeeks)),
    excludedFrameworks: input.excludedFrameworks,
    excludeVendorObligations: input.excludeVendor,
  };
}

export function boardObligationWhatIfToCsv(pack: BoardObligationWhatIfPack): string {
  const lines = [
    "scenario_id,peak_week_delta,current_week_delta,total_obligations_delta,overdue_delta,breach_delta,simulated_peak,simulated_total",
    ...pack.results.map((r) =>
      [
        r.scenario.id,
        r.peakWeekDelta,
        r.currentWeekDelta,
        r.totalObligationsDelta,
        r.currentOverdueDelta,
        r.breachCountDelta,
        r.simulated.peakWeekCount,
        r.simulated.totalForecastObligations,
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
