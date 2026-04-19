import {
  AUDIT_INTENT_LABELS,
  type AuditIntentTag,
} from "@/lib/guardrails/audit-intent-tags";

const pillTone: Record<
  AuditIntentTag,
  "border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90" | "border-sky-500/25 bg-sky-500/10 text-sky-100/90" | "border-violet-500/25 bg-violet-500/10 text-violet-100/90" | "border-white/[0.12] bg-white/[0.04] text-muted"
> = {
  manual: "border-white/[0.12] bg-white/[0.04] text-muted",
  automated: "border-sky-500/25 bg-sky-500/10 text-sky-100/90",
  approved: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90",
  system: "border-violet-500/25 bg-violet-500/10 text-violet-100/90",
};

export function AuditIntentTags({ tags }: { tags: AuditIntentTag[] }) {
  if (!tags.length) {
    return <span className="text-muted">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${pillTone[tag]}`}
        >
          {AUDIT_INTENT_LABELS[tag]}
        </span>
      ))}
    </div>
  );
}
