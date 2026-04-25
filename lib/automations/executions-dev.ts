import type {
  ActualOutcome,
  DecisionBrief,
  ExpectedOutcome,
  PolicySuggestion,
} from "@/lib/decision-intelligence";

export type ExecutionReceipt = {
  id: string;
  playbookId: string;
  ok: boolean;
  at: string;
  mode: "simulated" | "connector";
  rollbackPlan: string;
  approvalNote: string;
  incidentId?: string | null;
  decisionBrief?: DecisionBrief;
  expectedOutcome?: ExpectedOutcome;
  actualOutcome?: ActualOutcome;
  decisionAccuracyScore?: number;
  policySuggestions?: PolicySuggestion[];
};

const byTenant = new Map<string, ExecutionReceipt[]>();

function bucket(tid: string): ExecutionReceipt[] {
  let list = byTenant.get(tid);
  if (!list) {
    list = [];
    byTenant.set(tid, list);
  }
  return list;
}

export function recordExecution(
  tenantId: string,
  input: Omit<ExecutionReceipt, "id" | "at"> & { id?: string },
): ExecutionReceipt {
  const list = bucket(tenantId);
  const rec: ExecutionReceipt = {
    id: input.id ?? `exec-${Date.now()}`,
    playbookId: input.playbookId,
    ok: input.ok,
    mode: input.mode,
    rollbackPlan: input.rollbackPlan,
    approvalNote: input.approvalNote,
    at: new Date().toISOString(),
    ...(input.incidentId != null ? { incidentId: input.incidentId } : {}),
  };
  list.unshift(rec);
  byTenant.set(tenantId, list.slice(0, 40));
  return rec;
}

export function listExecutions(tenantId: string): ExecutionReceipt[] {
  return [...bucket(tenantId)];
}
