import { getConnectorHealthRows } from "@/lib/connectors-health";

export async function BackendStatus() {
  const rows = await getConnectorHealthRows();
  return (
    <div className="mb-6 rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">Backend status (server check)</p>
      <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
        {rows.map((r) => (
          <li key={r.id}>
            <span className="text-foreground/90">{r.name}:</span>{" "}
            {r.ok === null && "not configured"}
            {r.ok === true && <span className="text-emerald-400/90">up</span>}
            {r.ok === false && <span className="text-red-400/90">down / error</span>}
            {r.ms != null ? ` · ${r.ms}ms` : ""}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        Same data as <code className="text-accent">GET /api/backend/status</code> for client
        fetch from the browser.
      </p>
    </div>
  );
}
