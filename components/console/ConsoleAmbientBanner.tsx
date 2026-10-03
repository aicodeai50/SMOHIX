import { ConsoleAmbientCanvas } from "@/components/console/ConsoleAmbientCanvas";
import { ConsoleAmbientPulse } from "@/components/console/ConsoleAmbientPulse";
import { appBody } from "@/lib/app-typography";
import type { ConsoleAmbientSnapshot } from "@/lib/console/ambient-status";

export function ConsoleAmbientBanner({ snapshot }: { snapshot: ConsoleAmbientSnapshot }) {
  const localSession = snapshot.phases.some((phase) => phase.value === 'LOCAL SESSION');
  return (
    <section
      className="smohix-console-ambient-banner relative mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25"
      aria-label={localSession ? 'Local evaluation status' : 'Workspace status snapshot'}
    >
      <ConsoleAmbientCanvas />
      <div className="relative z-10 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          {localSession ? <span className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted">Local evaluation</span> : <ConsoleAmbientPulse health={snapshot.health} phases={snapshot.phases} />}
          <p className={`mt-3 max-w-xl ${appBody} text-muted`}>{localSession ? 'Local session data. Production health and shared workspace records are not verified here.' : snapshot.headline}</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted/70">
          Snapshot · <time dateTime={snapshot.generatedAt}>{snapshot.generatedAt.slice(11, 16)} UTC</time>
        </p>
      </div>
    </section>
  );
}
