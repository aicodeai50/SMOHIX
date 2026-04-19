import Link from "next/link";

const ITEMS = [
  {
    title: "Incident snapshot",
    body: "Command center shows open vs resolved counts, severity mix, and recent rows — managers see posture without digging.",
    href: "/auth/sign-in?next=/overview",
  },
  {
    title: "Per-incident timeline",
    body: "Status and context updates flow into a single thread when audit append is configured — fewer scattered threads.",
    href: "/auth/sign-in?next=/incidents",
  },
  {
    title: "Automation history",
    body: "Dry-runs and approvals are designed to land in the same activity log as incidents — one story for reviewers.",
    href: "/auth/sign-in?next=/audit",
  },
  {
    title: "Operational metrics",
    body: "MTTR, automation success rate, and change dashboards are not shipped as first-class charts yet — snapshot counts today, deeper analytics on the roadmap.",
    href: "/integrations",
  },
] as const;

export function ControlVisibilitySection() {
  return (
    <section
      id="control"
      className="border-b border-white/[0.06] py-16 sm:py-20"
      aria-labelledby="control-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="control-heading"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          Control and visibility
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Differentiation vs classic paging tools: we are not trying to replace your entire paging
          vendor on day one — we are trying to make the change that happens after the page safer
          and provable.
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {ITEMS.map((item) => (
            <li key={item.title} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
              <Link
                href={item.href}
                className="shrink-0 text-xs font-semibold text-accent hover:underline sm:pt-1"
              >
                Explore →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
