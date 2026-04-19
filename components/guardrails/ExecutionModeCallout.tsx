import { AppIcon } from "@/components/icons/AppIcon";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

function Row({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-emerald-500/20 text-emerald-200/95" : "bg-white/[0.06] text-muted"
        }`}
        aria-hidden
      >
        {ok ? (
          <AppIcon name="check" size={12} strokeWidth={2.75} className="text-emerald-200/95" />
        ) : (
          <AppIcon name="circle" size={10} strokeWidth={1.5} className="opacity-70" />
        )}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-foreground/90">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{detail}</p>
      </div>
    </div>
  );
}

export function ExecutionModeCallout({
  requiresApproval,
  dryRunAvailable,
  auditLogged,
}: {
  requiresApproval: boolean;
  dryRunAvailable: boolean;
  auditLogged: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5 md:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Execution mode
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {SITE_BRAND_NAME} defaults to safe paths: prove intent with a dry-run, route destructive work
        through approvals, and keep evidence in audit.
      </p>
      <div className="mt-5 space-y-4 border-t border-white/[0.06] pt-5">
        <Row
          ok={requiresApproval}
          label="Requires approval for gated work"
          detail="High-impact changes should land in the approvals queue before execution against production."
        />
        <Row
          ok={dryRunAvailable}
          label="Dry-run available"
          detail="Playbooks can be exercised against robot health checks without committing side effects here."
        />
        <Row
          ok={auditLogged}
          label="Audit logged when configured"
          detail="Signed-in runs can append immutable rows to audit_log when the service role is available."
        />
      </div>
    </div>
  );
}
