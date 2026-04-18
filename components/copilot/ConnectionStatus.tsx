import { getConnectorHealthRows } from "@/lib/connectors-health";

/** Copilot: shows whether linked services are reachable. */
export async function ConnectionStatus() {
  const rows = await getConnectorHealthRows();
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const reasoning = Boolean(process.env.SHYNVO_REASONING_API_URL?.trim());
  const brainLine = openai
    ? "OpenAI: configured — GPT replies from /api/copilot/chat"
    : reasoning
      ? "Copilot path can target external reasoning via NEXT_PUBLIC_COPILOT_PROXY_PATH"
      : "Copilot brain: offline mode (built-in) — add OPENAI_API_KEY for GPT";

  return (
    <div className="mb-6 rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">Intelligence</p>
      <p className="mt-1 font-mono text-xs text-emerald-400/90">{brainLine}</p>
      <p className="mt-3 font-medium text-foreground">Connections</p>
      <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
        {rows.map((r) => (
          <li key={r.id}>
            <span className="text-foreground/90">{r.name}:</span>{" "}
            {r.ok === null && "not connected"}
            {r.ok === true && <span className="text-emerald-400/90">reachable</span>}
            {r.ok === false && <span className="text-red-400/90">unreachable</span>}
            {r.ms != null ? ` · ${r.ms}ms` : ""}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        Shynvo checks these from the server when you open Copilot. Configure URLs under{" "}
        <span className="text-foreground/80">Settings → Connectors</span>.
      </p>
    </div>
  );
}
