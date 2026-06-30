import { isShBackendConfigured } from "@/lib/backend-urls";
import { appBody, appMeta } from "@/lib/app-typography";
import { getConnectorHealthRows } from "@/lib/connectors-health";

/** Copilot: shows whether linked services are reachable. */
export async function ConnectionStatus() {
  const rows = await getConnectorHealthRows();
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const reasoning = isShBackendConfigured();
  const proxyPath =
    process.env.NEXT_PUBLIC_COPILOT_PROXY_PATH?.trim() || "/api/copilot/chat";
  const usesReasoningProxy =
    proxyPath !== "/api/copilot/chat" && proxyPath.includes("/api/reasoning");
  const brainLine = openai
    ? "Full cloud model — Copilot drafts rich, contextual responses (sign in required when auth is enabled)."
    : usesReasoningProxy && reasoning
      ? "Chat is routed to your reasoning service via the configured proxy path (session required when auth is on)."
      : reasoning
        ? "Reasoning service linked — built-in chat uses it automatically when no cloud model key is set."
        : "Guided assistance — add OPENAI_API_KEY or REACT_APP_SH_BACKEND_API in deployment settings for deeper answers.";

  return (
    <div className={`zentro-glass mb-6 rounded-2xl px-4 py-4 md:px-5 md:py-5 ${appBody}`}>
      <div className="flex flex-col gap-4 md:flex-row md:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent/90">
            Assistant
          </p>
          <p className={`mt-1.5 text-muted ${appBody}`}>{brainLine}</p>
        </div>
        <div className="min-w-0 flex-1 border-t border-white/[0.06] pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent/90">
            Integrations
          </p>
          <ul className={`mt-2 space-y-2 ${appMeta}`}>
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-white/[0.05] pb-2 last:border-0 last:pb-0"
              >
                <span className="font-medium text-foreground/90">{r.name}</span>
                <span className="font-mono text-[11px] text-muted">
                  {r.ok === null && "Not configured"}
                  {r.ok === true && (
                    <span className="text-success">
                      Reachable{r.ms != null ? ` · ${r.ms}ms` : ""}
                    </span>
                  )}
                  {r.ok === false && <span className="text-danger">Unreachable</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className={`mt-4 border-t border-white/[0.06] pt-3 ${appMeta}`}>
        Status is checked on the server when this page loads. Configure endpoints under{" "}
        <span className="font-medium text-foreground/85">Settings → Connectors</span>.
      </p>
    </div>
  );
}
