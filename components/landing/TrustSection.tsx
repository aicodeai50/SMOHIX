import Link from "next/link";

const links = [
  {
    href: "/audit",
    title: "Audit log",
    line: "Who changed what, when — subscription sync, keys, approvals.",
    action: "View audit log",
  },
  {
    href: "/approvals",
    title: "Approvals",
    line: "Human gates before high-risk automation or policy overrides.",
    action: "Open approvals",
  },
  {
    href: "/settings",
    title: "Settings hub",
    line: "API keys, connectors, billing — one place for credentials and env.",
    action: "Open settings",
  },
] as const;

export function TrustSection() {
  return (
    <section id="trust" className="border-b border-white/[0.06] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Governance, not a second product tour
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Different job from the pillars above: evidence, gates, and access. Same console —
          different routes, no copy-paste cards.
        </p>

        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-6 sm:px-8 sm:py-8">
          <ul className="divide-y divide-white/[0.06]">
            {links.map((item) => (
              <li
                key={item.href}
                className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="min-w-0 sm:flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.line}</p>
                </div>
                <Link
                  href={item.href}
                  className="shrink-0 text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  {item.action} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
