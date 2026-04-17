import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = {
  title: "Connectors",
  description: "Connect reasoning and execution backends.",
};

const connectors = [
  {
    id: "reasoning",
    name: "sh-backend-api",
    role: "AI reasoning & copilot",
    status: "not configured",
  },
  {
    id: "robot",
    name: "Robot / automation backend",
    role: "Execution & workflows",
    status: "not configured",
  },
];

export default function ConnectorsPage() {
  return (
    <>
      <PageHeader
        title="Connectors"
        description="Point each connector at your deployed services. Secrets stay in environment variables on the server — nothing sensitive belongs in the browser."
      />
      <div className="space-y-4">
        {connectors.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-semibold text-foreground">{c.name}</h2>
              <p className="mt-1 text-sm text-muted">{c.role}</p>
              <p className="mt-2 font-mono text-xs text-amber-400/90">{c.status}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm text-muted opacity-70"
              disabled
            >
              Configure
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
