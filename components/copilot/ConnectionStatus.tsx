import { getConnectorHealthRows } from "@/lib/connectors-health";

/** Copilot: shows whether linked services are reachable. */
export async function ConnectionStatus() {
  const rows = await getConnectorHealthRows();
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const reasoning = Boolean(process.env.SHYNVO_REASONING_API_URL?.trim());
  const brainLine = openai
    ? "Full cloud model — Copilot can draft rich, contextual responses."
    : reasoning
      ? "Extended reasoning is linked — Copilot can use your organization’s model stack."
      : "Guided assistance — enable a cloud model in deployment settings for deeper answers.";

  return (
    <div className="shynvo-glass mb-6 rounded-2xl px-4 py-4 text-sm md:px-5 md:py-5">
      <div className="flex flex-col gap-4 md:flex-row md:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent/90">
            Assistant
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{brainLine}</p>
        </div>
        <div className="min-w-0 flex-1 border-t border-white/[0.06] pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent/90">
            Integrations
          </p>
          <ul className="mt-2 space-y-2 text-xs">
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
      <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs leading-relaxed text-muted">
        Status is checked on the server when this page loads. Configure endpoints under{" "}
        <span className="font-medium text-foreground/85">Settings → Connectors</span>.
      </p>
    </div>
  );
}
