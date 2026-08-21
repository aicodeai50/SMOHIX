import Link from "next/link";

import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { AppIcon } from "@/components/icons/AppIcon";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import {
  FLAGSHIP_PRODUCTS,
  SMOHIX_WORKSPACE_URLS,
} from "@/lib/ecosystem-workspaces";
import type { OrgRole } from "@/lib/org/roles";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

function formatRoleLabel(role: OrgRole | null): string | null {
  if (!role) return null;
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

const QUICK_START = [
  {
    href: "/platform",
    label: "Explore the platform",
    detail: "Public overview of Platform capabilities",
    icon: "layoutDashboard" as const,
  },
  {
    href: "/settings#setup-wizard",
    label: "Complete first-run setup",
    detail: "Profile, API keys, connectors",
    icon: "settings" as const,
  },
  {
    href: "/products",
    label: "Review products",
    detail: "Live, preview, and planned maturity",
    icon: "telescope" as const,
  },
  {
    href: "/docs",
    label: "Open documentation",
    detail: "Guides and reference",
    icon: "bookOpen" as const,
  },
  {
    href: "/docs/api",
    label: "API reference",
    detail: "HTTP catalog and shapes",
    icon: "server" as const,
  },
  {
    href: SMOHIX_WORKSPACE_URLS.ai,
    label: "Open Smohix AI",
    detail: "External AI workspace",
    icon: "bot" as const,
    external: true,
  },
  {
    href: "/pilot",
    label: "Request a pilot",
    detail: "Scoped enterprise engagement",
    icon: "workflow" as const,
  },
  {
    href: "/contact",
    label: "Contact Smohix",
    detail: "Sales and support inquiries",
    icon: "scrollText" as const,
  },
] as const;

const TRUST_LINKS = [
  { href: "/security", label: "Security" },
  { href: "/trust", label: "Trust" },
  { href: "/status", label: "Status" },
] as const;

export function HubOnboardingPanel({
  orgName,
  orgRole,
  hasOrganization,
  signedIn,
}: {
  orgName: string | null;
  orgRole: OrgRole | null;
  hasOrganization: boolean;
  signedIn: boolean;
}) {
  const roleLabel = formatRoleLabel(orgRole);

  return (
    <section
      className="smohix-glass mt-6 space-y-6 rounded-2xl p-5 md:p-6"
      aria-labelledby="hub-onboarding-heading"
    >
      <div>
        <p className={`${appMeta} uppercase tracking-wide text-accent/90`}>
          Welcome to {SITE_BRAND_NAME}
        </p>
          <h2 id="hub-onboarding-heading" className={`mt-1 ${appPanelTitle}`}>
            Needs attention and quick start
          </h2>
        <p className={`mt-2 max-w-2xl ${appBody} text-muted`}>
          Your signed-in Hub is the operations console. Use the paths below to configure your
          workspace, open products, and reach docs or Smohix AI — without guessing where to go next.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
        {signedIn ? (
          hasOrganization ? (
            <p className={appBody}>
              <span className="text-muted">Organization</span>{" "}
              <span className="font-medium text-foreground">{orgName ?? "Workspace"}</span>
              {roleLabel ? (
                <>
                  <span className="mx-2 text-muted">·</span>
                  <span className="text-muted">Role</span>{" "}
                  <span className="font-medium text-foreground">{roleLabel}</span>
                </>
              ) : null}
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={appBody}>
                <span className="font-medium text-foreground">No organization yet.</span>{" "}
                <span className="text-muted">
                  Create or join an organization to unlock shared members, roles, and workspace
                  settings.
                </span>
              </p>
              <Link
                href="/settings/members"
                className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-background ${appBody}`}
              >
                Create or join organization
              </Link>
            </div>
          )
        ) : (
          <p className={`${appBody} text-muted`}>
            Sign in for durable org context, shared history, and setup wizard progress. Core console
            routes still work in local demo mode.
          </p>
        )}
      </div>

      <div>
        <h3 className={`${appMeta} uppercase tracking-wide text-muted`}>Quick start</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_START.map((item) => {
            const className = `flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 transition-colors hover:border-accent/35 hover:bg-accent/[0.04] ${appBody}`;
            const body = (
              <>
                <AppIcon name={item.icon} size={18} className="mt-0.5 shrink-0 text-accent" />
                <span>
                  <span className="font-medium text-foreground">
                    {item.label}
                    {"external" in item && item.external ? " ↗" : ""}
                  </span>
                  <span className={`mt-0.5 block text-muted ${appMeta}`}>{item.detail}</span>
                </span>
              </>
            );
            return (
              <li key={item.href}>
                {"external" in item && item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {body}
                  </a>
                ) : (
                  <Link href={item.href} className={className}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className={`${appMeta} uppercase tracking-wide text-muted`}>Product status</h3>
          <Link href="/products" className={`font-medium text-accent hover:underline ${appMeta}`}>
            All products →
          </Link>
        </div>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {FLAGSHIP_PRODUCTS.map((product) => {
            const external = isExternalUrl(product.workspaceUrl);
            const openLabel =
              product.id === "smohix-platform"
                ? "Open Hub"
                : product.id === "smohix-ai"
                  ? "Open Smohix AI ↗"
                  : "Open workspace ↗";
            return (
              <li
                key={product.id}
                className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{product.name}</p>
                  <MaturityBadge maturity={product.status} />
                </div>
                <p className={`mt-2 flex-1 ${appMeta} text-muted`}>{product.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={product.href}
                    className={`rounded-lg border border-white/[0.1] px-3 py-1.5 font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
                  >
                    Overview
                  </Link>
                  {external ? (
                    <a
                      href={product.workspaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-lg bg-accent/15 px-3 py-1.5 font-medium text-accent transition-colors hover:bg-accent/25 ${appMeta}`}
                    >
                      {openLabel}
                    </a>
                  ) : (
                    <Link
                      href={product.workspaceUrl}
                      className={`rounded-lg bg-accent/15 px-3 py-1.5 font-medium text-accent transition-colors hover:bg-accent/25 ${appMeta}`}
                    >
                      {openLabel}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings/api-keys"
            className={`rounded-lg border border-white/[0.1] px-3 py-1.5 font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            API keys
          </Link>
          <Link
            href="/developers"
            className={`rounded-lg border border-white/[0.1] px-3 py-1.5 font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Developers
          </Link>
          {TRUST_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg border border-white/[0.1] px-3 py-1.5 font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className={`${appMeta} text-muted`}>
          Self-serve checkout remains deferred — use Contact or Pilot for Pro / Team access.
        </p>
      </div>
    </section>
  );
}
