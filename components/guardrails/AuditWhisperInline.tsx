import Link from "next/link";

import type { AuditWhisper } from "@/lib/audit/whispers";

export function AuditWhisperInline({
  whisper,
  scopeNote,
}: {
  whisper: AuditWhisper;
  /** e.g. clarify account-wide vs entity-specific */
  scopeNote?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        Audit signal · {whisper.atLabel}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{whisper.summary}</p>
      {scopeNote ? (
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{scopeNote}</p>
      ) : null}
      <Link href="/audit" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
        Open full audit log →
      </Link>
    </div>
  );
}
