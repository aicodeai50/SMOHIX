import Link from "next/link";

import type { AuditWhisper } from "@/lib/audit/whispers";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";

export function AuditWhisperInline({
  whisper,
  scopeNote,
}: {
  whisper: AuditWhisper;
  /** e.g. clarify account-wide vs entity-specific */
  scopeNote?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition-[border-color,box-shadow] duration-200 hover:border-white/[0.12] hover:shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
      <p className={appOverline}>
        Audit signal · {whisper.atLabel}
      </p>
      <p className={`mt-1.5 text-foreground/90 ${appBody}`}>{whisper.summary}</p>
      {scopeNote ? (
        <p className={`mt-1 ${appMeta}`}>{scopeNote}</p>
      ) : null}
      <Link href="/audit" className={`mt-2 inline-block font-medium text-accent hover:underline ${appMeta}`}>
        Open full audit log →
      </Link>
    </div>
  );
}
