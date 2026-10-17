import { getRobotBackendUrl, getShBackendApiUrl } from "@/lib/backend-urls";

const TIMEOUT_MS = 8000;

async function probe(
  paths: string[],
): Promise<{ ok: boolean; ms: number }> {
  for (const path of paths) {
    const start = Date.now();
    try {
      const res = await fetch(path, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: "application/json, text/plain, */*" },
      });
      const ms = Date.now() - start;
      await res.body?.cancel();
      if (res.ok) {
        return { ok: true, ms };
      }
    } catch { /* Only aggregate reachability leaves the server. */ }
  }
  return { ok: false, ms: 0 };
}

export type ConnectorRow = {
  id: "reasoning" | "robot";
  name: string;
  role: string;
  configured: boolean;
  ok: boolean | null;
  ms: number | null;
  detail: string;
};

export async function getConnectorHealthRows(): Promise<ConnectorRow[]> {
  const reasoningBase = getShBackendApiUrl();
  const robotBase = getRobotBackendUrl();

  const reasoning: ConnectorRow = {
    id: "reasoning",
    name: "Reasoning",
    role: "AI reasoning & Copilot",
    configured: Boolean(reasoningBase),
    ok: null,
    ms: null,
    detail: "",
  };

  const robot: ConnectorRow = {
    id: "robot",
    name: "Automation",
    role: "Execution & workflows",
    configured: Boolean(robotBase),
    ok: null,
    ms: null,
    detail: "",
  };

  const [reasoningProbe, robotProbe] = await Promise.all([
    reasoningBase ? probe([`${reasoningBase}/health`]) : null,
    robotBase ? probe([`${robotBase}/health`]) : null,
  ]);

  if (reasoningProbe) {
    const r = reasoningProbe;
    reasoning.ok = r.ok;
    reasoning.ms = r.ok ? r.ms : null;
    reasoning.detail = r.ok ? "Connection verified." : "Connection could not be verified. Contact your workspace administrator.";
  } else {
    reasoning.detail =
      "Not connected. Contact your workspace administrator.";
  }

  if (robotProbe) {
    const r = robotProbe;
    robot.ok = r.ok;
    robot.ms = r.ok ? r.ms : null;
    robot.detail = r.ok ? "Connection verified." : "Connection could not be verified. Contact your workspace administrator.";
  } else {
    robot.detail =
      "Not connected. Contact your workspace administrator.";
  }

  return [reasoning, robot];
}
