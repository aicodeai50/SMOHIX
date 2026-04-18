import Link from "next/link";

const items = [
  {
    title: "Audit logs",
    href: "/audit",
    body: "Immutable records of who approved what, when, and under which policy version.",
  },
  {
    title: "Approval gates",
    href: "/approvals",
    body: "Risk-tiered workflows: single approver for low risk, multi-party for production impact.",
  },
  {
    title: "Scoped access",
    href: "/settings/api-keys",
    body: "API keys and connectors you control — operators integrate, owners govern credentials.",
  },
] as const;

export function TrustSection() {
  return (
    <section id="trust" className="border-b border-white/[0.06] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Trust by design
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Enterprise buyers expect proof, not promises. Open the areas that matter and
          validate the model in your own environment.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-[border-color,background-color,box-shadow] hover:border-accent/30 hover:bg-white/[0.04] hover:shadow-[0_0_28px_-14px_rgba(94,225,255,0.15)]"
            >
              <div className="mb-3 h-1 w-10 rounded-full bg-accent/80 transition-transform group-hover:scale-x-110" />
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.body}</p>
              <span className="mt-4 text-sm font-medium text-accent group-hover:underline">
                Open in console →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
