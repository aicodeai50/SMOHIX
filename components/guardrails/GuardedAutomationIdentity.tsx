export function GuardedAutomationIdentity() {
  return (
    <p className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3 text-xs leading-relaxed text-cyan-50/90">
      <span className="font-semibold text-cyan-100/95">Controlled execution.</span> All
      automation in Zentro is designed to be{" "}
      <span className="text-foreground/88">policy-aware, approval-ready, and auditable</span> — not
      silent background scripts.
    </p>
  );
}
