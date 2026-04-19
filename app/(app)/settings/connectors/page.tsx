import type { Metadata } from "next";
import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { getConnectorHealthRows } from "@/lib/connectors-health";

export const metadata: Metadata = {
  title: "Connectors",
  description: "Link reasoning and automation services to Shynvo.",
};

export const dynamic = "force-dynamic";

export default async function ConnectorsPage() {
  const connectors = await getConnectorHealthRows();
  const noneConfigured = connectors.every((c) => !c.baseUrl);

  return (
    <>
      <PageHeader
        title="Connectors"
        description="URLs are read from server environment variables. Health checks run on the server when you open this page."
      />
      {noneConfigured ? (
        <div className="mb-6">
          <ConsoleEmptyState
            title="No connectors configured"
            description="Point Shynvo at your reasoning and automation backends so Copilot, dry-runs, and guarded execution can reach your stack. Set the env vars on your deployment, redeploy, then refresh this page."
            ctas={[
              { href: "/docs/api", label: "API reference", variant: "secondary" },
              { href: "/docs", label: "Platform docs", variant: "secondary" },
            ]}
            footnote={
              <p>
                Set <span className="font-mono text-foreground/80">SHYNVO_REASONING_API_URL</span>{" "}
                and <span className="font-mono text-foreground/80">SHYNVO_ROBOT_API_URL</span> to
                HTTPS base URLs (no trailing slash required).
              </p>
            }
          />
        </div>
      ) : null}
      <div className="space-y-4">
        {connectors.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-surface/80 p-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <h2 className={appPanelTitle}>{c.name}</h2>
              <p className={`mt-1 text-muted ${appBody}`}>{c.role}</p>
              {c.baseUrl ? (
                <p className={`mt-2 truncate font-mono ${appMeta}`} title={c.baseUrl}>
                  {c.baseUrl}
                </p>
              ) : null}
              <p className={`mt-2 font-mono ${appMeta}`}>{c.detail}</p>
              <p className={`mt-2 ${appBody}`}>
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
                  className={`rounded-lg border border-border px-4 py-2 text-foreground transition-colors hover:border-accent/40 ${appBody}`}
                >
                  Open service
                </a>
              ) : null}
              {c.id === "robot" && c.baseUrl && c.ok ? (
                <a
                  href={`${c.baseUrl}${c.docsPath ?? "/docs"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${appMeta} hover:text-accent`}
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
