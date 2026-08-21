import Link from "next/link";

import { isShBackendConfigured } from "@/lib/backend-urls";
import { appBody, appMeta } from "@/lib/app-typography";
import { getConnectorHealthRows } from "@/lib/connectors-health";

/** Copilot connection status — product language, not env-var instructions. */
export async function ConnectionStatus() {
  const rows = await getConnectorHealthRows();
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const reasoning = isShBackendConfigured();
  const proxyPath =
    process.env.NEXT_PUBLIC_COPILOT_PROXY_PATH?.trim() || "/api/copilot/chat";
  const usesReasoningProxy =
    proxyPath !== "/api/copilot/chat" && proxyPath.includes("/api/reasoning");

  const advancedReady = openai || (usesReasoningProxy && reasoning) || reasoning;
  const statusLabel = advancedReady ? "Ready" : "Limited";
  const statusClass = advancedReady
    ? "bg-emerald-500/16 text-emerald-200"
    : "bg-amber-400/14 text-amber-100";

  const brainLine = openai
    ? "Copilot can draft rich, contextual responses for incidents, services, and runbooks."
    : usesReasoningProxy && reasoning
      ? "Chat is routed to your workspace reasoning service."
      : reasoning
        ? "Workspace reasoning is linked — Copilot uses it when cloud models are not enabled."
        : "Advanced reasoning isn't configured for this workspace. Guided assistance still works.";

  return (
    <div className={`rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 ${appBody}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Copilot status
          </p>
          <p className={`mt-1 text-muted ${appMeta}`}>{brainLine}</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>
      {!advancedReady ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/settings/connectors"
            className={`inline-flex h-9 items-center justify-center rounded-lg bg-accent px-3 font-semibold text-background ${appMeta}`}
          >
            Configure Copilot
          </Link>
          <Link
            href="/docs"
            className={`inline-flex h-9 items-center justify-center rounded-lg border border-white/[0.1] px-3 font-medium text-muted hover:text-foreground ${appMeta}`}
          >
            Documentation
          </Link>
        </div>
      ) : null}
      <ul className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.06] pt-3 ${appMeta}`}>
        {rows.map((r) => (
          <li key={r.id} className="text-muted">
            <span className="font-medium text-foreground/85">{r.name}</span>
            {": "}
            {r.ok === null && "Not configured"}
            {r.ok === true && (
              <span className="text-success">
                Reachable{r.ms != null ? ` · ${r.ms}ms` : ""}
              </span>
            )}
            {r.ok === false && <span className="text-danger">Unreachable</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
