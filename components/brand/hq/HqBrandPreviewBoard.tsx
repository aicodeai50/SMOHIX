"use client";

import { HqDomainLockup, HqMark, HqMicroMark } from "@/components/brand/hq/HqMark";
import { HQ_CONCEPT_NAME } from "@/lib/brand/hq/geometry";

function Swatch({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-white/[0.08] p-6 ${className}`}>
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      {children}
    </div>
  );
}

/** Internal HQ brand review board — not linked from public navigation. */
export function HqBrandPreviewBoard() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <header className="space-y-2 border-b border-white/[0.08] pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500/90">
          Internal · Not shipped
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Smohix HQ corporate identity — {HQ_CONCEPT_NAME}
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Proposal for smohix.run headquarters branding. Distinct from Smohix AI Aperture S at
          ai.smohix.run. Live header/footer remain unchanged until visual approval.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Primary wordmark — smohix</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Swatch label="Light / on white" className="bg-white text-black">
            <HqMark tone="mono" width={280} />
          </Swatch>
          <Swatch label="Dark / on black" className="bg-black text-white">
            <HqMark tone="dark" width={280} />
          </Swatch>
          <Swatch label="Monochrome / UI" className="bg-surface text-foreground">
            <HqMark tone="light" width={280} />
          </Swatch>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Domain lockup — smohix.run</h2>
        <Swatch label="Standard corporate" className="bg-surface text-foreground">
          <HqDomainLockup width={360} />
        </Swatch>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Micro-mark (favicon scale)</h2>
        <p className="text-sm text-muted">
          Derived from HQ plate geometry — not the Smohix AI Aperture S.
        </p>
        <div className="flex flex-wrap items-end gap-8">
          {[16, 24, 32, 48].map((px) => (
            <div key={px} className="text-center">
              <div className="mb-2 inline-flex rounded-lg border border-white/[0.1] bg-surface p-2">
                <HqMicroMark size={px} tone="light" />
              </div>
              <p className="text-xs text-muted">{px}px</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Header simulation</h2>
        <div className="rounded-xl border border-white/[0.08] bg-background/80 px-4 py-3 backdrop-blur">
          <div className="flex h-12 items-center justify-between">
            <HqMark width={120} height={38} tone="light" decorative />
            <span className="text-xs text-muted">Navigation unchanged in proposal</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Small-size stress test</h2>
        <div className="flex items-center gap-6 rounded-xl border border-white/[0.08] bg-surface p-4">
          <HqMark width={72} height={24} tone="light" />
          <HqMark width={96} height={30} tone="light" />
          <HqMicroMark size={20} tone="light" />
        </div>
      </section>

      <section className="space-y-2 text-sm text-muted">
        <h2 className="text-lg font-semibold text-foreground">Brand architecture rule</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Smohix HQ (smohix.run) — Precision Plate corporate identity</li>
          <li>Smohix AI (ai.smohix.run) — Aperture S product identity (unchanged)</li>
          <li>Other products may receive distinct marks under shared design language</li>
        </ul>
      </section>
    </div>
  );
}
