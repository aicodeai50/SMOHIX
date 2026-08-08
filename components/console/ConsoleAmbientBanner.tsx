import { ConsoleAmbientCanvas } from "@/components/console/ConsoleAmbientCanvas";
import { ConsoleAmbientPulse } from "@/components/console/ConsoleAmbientPulse";
import { appBody } from "@/lib/app-typography";
import type { ConsoleAmbientSnapshot } from "@/lib/console/ambient-status";

export function ConsoleAmbientBanner({ snapshot }: { snapshot: ConsoleAmbientSnapshot }) {
  return (
    <section
      className="smohix-console-ambient-banner relative mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25"
      aria-label="Live operational status"
    >
      <ConsoleAmbientCanvas />
      <div className="relative z-10 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <ConsoleAmbientPulse health={snapshot.health} phases={snapshot.phases} />
          <p className={`mt-3 max-w-xl ${appBody} text-muted`}>{snapshot.headline}</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted/70">
          Live workspace telemetry
        </p>
      </div>
    </section>
  );
}
