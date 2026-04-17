const items = [
  {
    title: "Audit logs",
    body: "Immutable records of who approved what, when, and under which policy version.",
  },
  {
    title: "Approval gates",
    body: "Risk-tiered workflows: single approver for low risk, multi-party for production impact.",
  },
  {
    title: "Role-based safety",
    body: "Scopes and guardrails per team — operators execute, owners approve, auditors read.",
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="border-b border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Trust by design
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Enterprise buyers expect proof, not promises. Shynvo is structured around
          defensible operations from day one.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-background p-6"
            >
              <div className="mb-3 h-1 w-10 rounded-full bg-accent/80" />
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
