import Link from "next/link";

const links = [
  {
    href: "/audit",
    title: "Audit log",
    line: "Billing sync, API keys, approvals, and automation events in one append-only log.",
    action: "View",
    actionAria: "View audit log",
  },
  {
    href: "/approvals",
    title: "Approvals",
    line: "Review and record decisions before high-risk changes proceed.",
    action: "Open",
    actionAria: "Open approvals",
  },
  {
    href: "/settings",
    title: "Settings",
    line: "API keys, connectors, billing, and organization options.",
    action: "Configure",
    actionAria: "Open settings",
  },
] as const;

export function TrustSection() {
  return (
    <section id="trust" className="border-b border-white/[0.06] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Governance and access
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Evidence, authorization, and credentials — complementary to the product modules
          above.
        </p>

        <div className="mt-8 rounded-lg border border-white/[0.08] bg-white/[0.02] px-5 py-1 sm:px-6">
          <ul className="divide-y divide-white/[0.06]">
            {links.map((item) => (
              <li
                key={item.href}
                className="flex flex-col gap-2 py-4 first:pt-3 last:pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
              >
                <div className="min-w-0 sm:flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{item.line}</p>
                </div>
                <Link
                  href={item.href}
                  aria-label={item.actionAria}
                  className="shrink-0 text-sm font-medium text-accent/95 underline-offset-4 hover:text-accent hover:underline"
                >
                  {item.action}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
