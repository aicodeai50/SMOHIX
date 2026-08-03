import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { ZENTRO_WORKSPACE_URLS } from "@/lib/ecosystem-workspaces";
import { mBody, mCard, mCardTitle, mContainer, mH2, mSection } from "@/lib/marketing-layout";

const PLATFORM_CAPABILITIES = [
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

export function PlatformWorkspaceIntro() {
  return (
    <>
      <section className={`${mSection} border-b border-white/[0.06]`}>
        <div className={mContainer}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">
            Platform workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Your operational workspace after sign-in
          </h1>
          <p className={`mt-4 max-w-2xl ${mBody}`}>
            Zentro Platform is the authenticated operations layer — incidents, automation,
            governance, and administration. It lives at{" "}
            <a
              href={ZENTRO_WORKSPACE_URLS.platform}
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              platform.zentro.run
            </a>{" "}
            and through the console on zentro.run — same ecosystem, same identity.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/sign-in?next=/hub">
              <Button size="lg">Sign in to Platform</Button>
            </Link>
            <Link href="/products/zentro-platform">
              <Button size="lg" variant="secondary">
                Product overview
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={mSection}>
        <div className={mContainer}>
          <h2 className={mH2}>What you manage inside Platform</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_CAPABILITIES.map((item) => (
              <Link key={item.title} href={item.href} className={`${mCard} block hover:border-accent/30`}>
                <h3 className={mCardTitle}>{item.title}</h3>
                <p className={`mt-2 ${mBody}`}>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
