import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = {
  title: "Settings",
  description: "Billing, connectors, and workspace configuration.",
};

const cards = [
  {
    href: "/settings/billing",
    title: "Billing",
    description: "Plan, Lemon checkout with your account id, and subscription status.",
  },
  {
    href: "/settings/api-keys",
    title: "API keys",
    description: "Generate keys for scripts calling /api/reasoning and /api/robot.",
  },
  {
    href: "/settings/connectors",
    title: "Connectors",
    description: "Reasoning and automation service URLs and health checks.",
  },
] as const;

export default function SettingsIndexPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure billing and linked services for this workspace."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-border bg-surface/80 p-5 transition-colors hover:border-accent/40 hover:bg-surface-elevated/40"
          >
            <h2 className="text-lg font-semibold text-foreground">{c.title}</h2>
            <p className="mt-2 text-sm text-muted">{c.description}</p>
            <span className="mt-4 inline-block text-sm font-medium text-accent">Open →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
