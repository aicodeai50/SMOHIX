export type ConnectorExecution =
  | { ok: true; receipt: Record<string, unknown>; steps: { label?: string; status?: string; output?: unknown }[] }
  | { ok: false; message: string; uncertain: boolean };

/** Uses the existing robot remediation contract. Never retries an infrastructure action. */
export async function executeRobotAction(base: string, input: {
  playbookId: string; incidentId?: string | null; rollbackPlan: string; approvalNote: string;
}, requestId: string, transport: typeof fetch = fetch): Promise<ConnectorExecution> {
  try {
    const response = await transport(`${base.replace(/\/+$/, "")}/v1/remediate`, {
      method: "POST", redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(60_000),
      headers: { "Content-Type": "application/json", Accept: "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify({ playbook_id: input.playbookId, incident_id: input.incidentId ?? null,
        rollback_plan: input.rollbackPlan, approval_note: input.approvalNote, request_id: requestId }),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || response.status === 202) return { ok: false, uncertain: response.status >= 500 || response.status === 202,
      message: "The automation service did not confirm execution. Verify its activity before retrying." };
    if (!body || typeof body !== "object" || Array.isArray(body) || !("ok" in body) || body.ok !== true) {
      return { ok: false, uncertain: true,
        message: "Execution was not confirmed by the automation service. Verify its activity before retrying." };
    }
    const result = body as { receipt?: unknown; steps?: unknown };
    if (result.steps !== undefined && (!Array.isArray(result.steps) || result.steps.some(step => !step || typeof step !== "object" || Array.isArray(step)))) {
      return { ok: false, uncertain: true, message: "The automation service returned incomplete step evidence. Verify its activity before retrying." };
    }
    const steps = Array.isArray(result.steps) ? result.steps.filter((step): step is { label?: string; status?: string; output?: unknown } =>
      Boolean(step && typeof step === "object" && !Array.isArray(step))) : [];
    if (steps.some(step => step.status !== "succeeded" && step.status !== "skipped")) {
      return { ok: false, uncertain: true, message: "The automation service has not completed every step. Verify its activity before retrying." };
    }
    const receipt = result.receipt && typeof result.receipt === "object" && !Array.isArray(result.receipt)
      ? result.receipt as Record<string, unknown> : {};
    return { ok: true, receipt, steps };
  } catch {
    return { ok: false, uncertain: true,
      message: "The execution result could not be confirmed. Verify automation service activity before retrying." };
  }
}
