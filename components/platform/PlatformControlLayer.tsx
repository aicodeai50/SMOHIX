import Link from "next/link";
import { getRegistryProduct, registryMaturityLabel } from "@/lib/product-registry";

import { mBody, mFocusRing, mH2, mSystemMeta } from "@/lib/marketing-layout";

const CONTROL_CAPABILITIES = [
  {
    title: "Organizations",
    description: "Members, roles, billing, and workspace administration.",
    href: "/auth/sign-in?next=/settings/members",
  },
  {
    title: "Projects",
    productId: "projects",
    description: "Team and environment organization — expanding on live org foundations.",
    href: "/products/projects",
  },
  {
    title: "Knowledge",
    productId: "knowledge",
    description: "Runbooks, evidence, and shared operational context.",
    href: "/products/knowledge",
  },
  {
    title: "Agents",
    productId: "agents",
    description: "Guarded automation playbooks with dry-runs and approvals.",
    href: "/products/agents",
  },
  {
    title: "Usage & overview",
    description: "Command center metrics and operational signals when signed in.",
    href: "/auth/sign-in?next=/overview",
  },
  {
    title: "Settings",
    description: "Connectors, deployment, API keys, and notification preferences.",
    href: "/auth/sign-in?next=/settings",
  },
] as const;

/** Organization and workspace control plane — architecture bands, not equal cards. */
export function PlatformControlLayer() {
  return (
    <section className="smohix-platform-control-layer" aria-labelledby="platform-control-heading">
      <div className="smohix-platform-control-layer__intro">
        <div className="smohix-platform-control-layer__rail" aria-hidden />
        <div>
          <p className={`${mSystemMeta} text-accent/70`}>Organization · control plane</p>
          <h2 id="platform-control-heading" className={mH2}>
            What you manage inside Platform
          </h2>
          <p className={`mt-2 max-w-2xl ${mBody} text-muted/85`}>
            Manage your organization and workspace settings. Explore Projects, Knowledge, and Agents
            with their current product maturity shown below.
          </p>
        </div>
      </div>
      <ul className="smohix-platform-control-layer__grid">
        {CONTROL_CAPABILITIES.map((item) => (
          <li key={item.title}>
            <Link href={item.href} className={`smohix-platform-control-plane ${mFocusRing}`}>
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="smohix-platform-control-plane__title">{item.title}</span>
                {'productId' in item && <span className="rounded-md border border-border px-2 py-1 text-xs text-muted">
                  {registryMaturityLabel(getRegistryProduct(item.productId)!.maturity)}
                </span>}
              </span>
              <span className="smohix-platform-control-plane__body">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
