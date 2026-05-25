import type { ComplianceControlRef } from "@/lib/compliance/types";

const FRAMEWORK_STYLE: Record<string, string> = {
  soc2: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  iso27001: "border-teal-400/30 bg-teal-400/10 text-teal-200",
  pcidss: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  hipaa: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  nist_csf: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  cis_v8: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  cmmc_l2: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  gdpr_art32: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
};

export function ComplianceControlTags({
  controls,
  max = 4,
}: {
  controls: ComplianceControlRef[];
  max?: number;
}) {
  if (!controls.length) {
    return <span className="text-muted">—</span>;
  }
  const visible = controls.slice(0, max);
  const rest = controls.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((c) => (
        <span
          key={c.id}
          title={c.id}
          className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium ${FRAMEWORK_STYLE[c.framework] ?? FRAMEWORK_STYLE.soc2}`}
        >
          {c.ref}
        </span>
      ))}
      {rest > 0 ? <span className="text-[10px] text-muted">+{rest}</span> : null}
    </div>
  );
}
