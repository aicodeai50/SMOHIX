import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { getConnectorHealthRows } from "@/lib/connectors-health";

export const metadata: Metadata = {
  title: "Connectors",
  description: "Link reasoning and automation services to Shynvo.",
};

export const dynamic = "force-dynamic";

export default async function ConnectorsPage() {
  const connectors = await getConnectorHealthRows();

  return (
    <>
      <PageHeader
        title="Connectors"
        description="URLs are read from server environment variables (Railway Variables). Health checks run on the server when you open this page."
      />
      <div className="space-y-4">
        {connectors.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-surface/80 p-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-foreground">{c.name}</h2>
              <p className="mt-1 text-sm text-muted">{c.role}</p>
              {c.baseUrl ? (
                <p className="mt-2 truncate font-mono text-xs text-muted" title={c.baseUrl}>
                  {c.baseUrl}
                </p>
              ) : null}
              <p className="mt-2 font-mono text-xs text-muted">{c.detail}</p>
              <p className="mt-2 text-sm">
                {c.ok === null && (
                  <span className="text-amber-400/90">Not configured</span>
                )}
                {c.ok === true && (
                  <span className="text-emerald-400/90">
                    Reachable{c.ms != null ? ` · ${c.ms}ms` : ""}
                  </span>
                )}
                {c.ok === false && (
                  <span className="text-red-400/90">Unreachable or error</span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              {c.baseUrl && c.ok ? (
                <a
                  href={c.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-accent/40"
                >
                  Open service
                </a>
              ) : null}
              {c.id === "robot" && c.baseUrl && c.ok ? (
                <a
                  href={`${c.baseUrl}${c.docsPath ?? "/docs"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted hover:text-accent"
                >
                  API docs →
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
