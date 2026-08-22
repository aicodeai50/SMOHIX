import Link from "next/link";

import { mBody, mFocusRing, mH2, mSystemMeta } from "@/lib/marketing-layout";

const CONTROL_CAPABILITIES = [
  {
    title: "Organizations",
    description: "Members, roles, billing, and workspace administration.",
    href: "/auth/sign-in?next=/settings/members",
  },
  {
    title: "Projects",
    description: "Team and environment organization — expanding on live org foundations.",
    href: "/products/projects",
  },
  {
    title: "Knowledge",
    description: "Runbooks, evidence, and shared operational context.",
    href: "/products/knowledge",
  },
  {
    title: "Agents",
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
            Workspace administration, team structure, knowledge, agents, and settings — the organizational
            layer above day-to-day operations.
          </p>
        </div>
      </div>
      <ul className="smohix-platform-control-layer__grid">
        {CONTROL_CAPABILITIES.map((item) => (
          <li key={item.title}>
            <Link href={item.href} className={`smohix-platform-control-plane ${mFocusRing}`}>
              <span className="smohix-platform-control-plane__title">{item.title}</span>
              <span className="smohix-platform-control-plane__body">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
