"use client";

import { SmohixHqLockup } from "@/components/brand/hq/SmohixHqLockup";
import { SmohixHqMark } from "@/components/brand/hq/SmohixHqMark";
import { SmohixHqWordmark } from "@/components/brand/hq/SmohixHqWordmark";
import { HQ_CONCEPT_NAME } from "@/lib/brand/hq/geometry";

const SIZES = [512, 192, 96, 64, 48, 32, 24, 16] as const;

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

function FaviconSim({ px }: { px: number }) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-sm border border-white/10 bg-[#f4f4f5]"
      style={{ width: px + 8, height: px + 8 }}
      title={`${px}px favicon simulation`}
    >
      <SmohixHqMark tone="light" micro size={px} decorative />
    </div>
  );
}

/** Internal HQ brand review board — not linked from public navigation. */
export function HqBrandPreviewBoard() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <header className="space-y-2 border-b border-white/[0.08] pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500/90">
          Internal · Not shipped · Visual review
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Smohix HQ corporate identity — {HQ_CONCEPT_NAME}
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Approved geometric S identity for smohix.run. Distinct from Smohix AI Aperture S at
          ai.smohix.run. Reference image used as visual source of truth.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Symbol — S + registration dot</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Swatch label="Light / on white" className="bg-white">
            <SmohixHqMark tone="light" size={160} />
          </Swatch>
          <Swatch label="Dark / on black" className="bg-black">
            <SmohixHqMark tone="dark" size={160} />
          </Swatch>
          <Swatch label="Monochrome / UI" className="bg-surface text-foreground">
            <SmohixHqMark tone="mono" size={160} />
          </Swatch>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Horizontal wordmark — smohix.run</h2>
        <Swatch label="Standard header wordmark" className="bg-background">
          <SmohixHqWordmark tone="dark" symbolSize={32} />
        </Swatch>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Vertical lockup</h2>
        <Swatch label="OG / social composition" className="bg-black">
          <SmohixHqLockup tone="dark" symbolSize={140} direction="vertical" />
        </Swatch>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Scale ladder — symbol only</h2>
        <div className="flex flex-wrap items-end gap-6">
          {SIZES.map((px) => (
            <div key={px} className="text-center">
              <div className="mb-2 inline-flex rounded-lg border border-white/[0.1] bg-black p-2">
                <SmohixHqMark tone="dark" micro={px <= 48} size={px} decorative />
              </div>
              <p className="text-xs text-muted">{px}px</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Favicon simulation (S only — no text)</h2>
        <div className="flex flex-wrap items-end gap-4">
          {[16, 24, 32, 48].map((px) => (
            <div key={px} className="text-center">
              <FaviconSim px={px} />
              <p className="mt-2 text-xs text-muted">{px}px</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Desktop header simulation</h2>
        <div className="rounded-xl border border-white/[0.08] bg-background/80 px-4 py-3 backdrop-blur">
          <div className="flex h-12 items-center justify-between">
            <SmohixHqWordmark tone="dark" symbolSize={28} decorative />
            <span className="text-xs text-muted">Navigation placeholder</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Mobile header simulation</h2>
        <div className="max-w-[360px] rounded-xl border border-white/[0.08] bg-background/80 px-3 py-3">
          <SmohixHqWordmark tone="dark" symbolSize={24} />
        </div>
        <div className="max-w-[280px] rounded-xl border border-white/[0.08] bg-background/80 px-3 py-3">
          <SmohixHqWordmark tone="dark" symbolSize={22} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Footer simulation</h2>
        <div className="rounded-xl border border-white/[0.08] bg-surface/40 p-6">
          <SmohixHqWordmark tone="dark" symbolSize={30} />
          <p className="mt-3 text-sm text-muted">Smohix Technologies · smohix.run</p>
        </div>
      </section>

      <section className="space-y-2 text-sm text-muted">
        <h2 className="text-lg font-semibold text-foreground">Brand architecture rule</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Smohix HQ (smohix.run) — Flow Mark geometric S identity</li>
          <li>Smohix AI (ai.smohix.run) — Aperture S product identity (unchanged)</li>
          <li>Favicon uses S symbol only — no smohix.run text</li>
        </ul>
      </section>
    </div>
  );
}
