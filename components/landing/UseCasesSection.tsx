import { mCard, mContainer, mH2, mLede, mSection } from "@/lib/marketing-layout";

const CASES = [
  {
    title: "Restart failing services with approval",
    body: "Wire a playbook, dry-run impact, get a recorded approval, then execute through your automation connector.",
  },
  {
    title: "Rollback or mitigate bad deployments",
    body: "Pair Copilot checklists with automation dry-runs so the team agrees on the smallest safe step before touching prod.",
  },
  {
    title: "Handle alerts with controlled automation",
    body: "HTTP ingest opens or dedupes incidents; responders link runbooks and only then promote actions out of simulation.",
  },
  {
    title: "Track every production change",
    body: "Keep status, approvals, and automation events in one audit trail — export incident notes when compliance asks.",
  },
] as const;

export function UseCasesSection() {
  return (
    <section id="use-cases" className={mSection} aria-labelledby="use-cases-heading">
      <div className={mContainer}>
        <h2 id="use-cases-heading" className={mH2}>
          Concrete outcomes
        </h2>
        <p className={mLede}>
          Operational outcomes you can assign an owner to — phrased the way on-call engineers and
          change managers actually talk.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {CASES.map((c) => (
            <li key={c.title} className={mCard}>
              <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
