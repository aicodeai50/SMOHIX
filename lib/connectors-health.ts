const TIMEOUT_MS = 8000;

function normalizeBase(url: string | undefined): string | null {
  const t = url?.trim();
  if (!t) return null;
  return t.replace(/\/+$/, "");
}

async function probe(
  base: string,
  paths: string[],
): Promise<{ ok: boolean; ms: number; pathUsed: string; snippet: string }> {
  let lastErr = "unreachable";
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
      const snippet = (await res.text()).slice(0, 160);
      if (res.ok) {
        return { ok: true, ms, pathUsed: path, snippet };
      }
      lastErr = `HTTP ${res.status}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  return { ok: false, ms: 0, pathUsed: paths[0] ?? base, snippet: lastErr };
}

export type ConnectorRow = {
  id: "reasoning" | "robot";
  name: string;
  role: string;
  baseUrl: string | null;
  ok: boolean | null;
  ms: number | null;
  detail: string;
  docsPath?: string;
};

export async function getConnectorHealthRows(): Promise<ConnectorRow[]> {
  const reasoningBase = normalizeBase(process.env.ZENTRO_REASONING_API_URL);
  const robotBase = normalizeBase(process.env.ZENTRO_ROBOT_API_URL);

  const reasoning: ConnectorRow = {
    id: "reasoning",
    name: "Reasoning",
    role: "AI reasoning & Copilot",
    baseUrl: reasoningBase,
    ok: null,
    ms: null,
    detail: "",
  };

  const robot: ConnectorRow = {
    id: "robot",
    name: "Automation",
    role: "Execution & workflows",
    baseUrl: robotBase,
    ok: null,
    ms: null,
    detail: "",
    docsPath: "/docs",
  };

  if (reasoningBase) {
    const r = await probe(reasoningBase, [
      `${reasoningBase}/health`,
      reasoningBase,
    ]);
    reasoning.ok = r.ok;
    reasoning.ms = r.ok ? r.ms : null;
    reasoning.detail = r.snippet || r.pathUsed;
  } else {
    reasoning.detail =
      "Not connected — add the reasoning service URL in your deployment settings.";
  }

  if (robotBase) {
    const r = await probe(robotBase, [`${robotBase}/health`, robotBase]);
    robot.ok = r.ok;
    robot.ms = r.ok ? r.ms : null;
    robot.detail = r.snippet || r.pathUsed;
  } else {
    robot.detail =
      "Not connected — add the automation service URL in your deployment settings.";
  }

  return [reasoning, robot];
}
