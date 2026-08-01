import Link from "next/link";

import type { TechnologyFlowStep } from "@/lib/technology-content";
import { mBody, mCardMotion, mH3 } from "@/lib/marketing-layout";

type ExecutiveFlowDiagramProps = {
  steps: readonly TechnologyFlowStep[];
  /** Accessible name for the diagram. */
  ariaLabel: string;
  headingId?: string;
};

function StepCard({ step }: { step: TechnologyFlowStep }) {
  const className = [
    "w-full rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-5 py-4 text-center",
    mCardMotion,
    "hover:border-accent/35 hover:shadow-[0_0_32px_-12px_rgba(94,225,255,0.25)]",
    "focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/30 focus-within:ring-offset-2 focus-within:ring-offset-background",
  ].join(" ");

  const inner = (
    <>
      <h3 className={`${mH3} text-base`}>{step.label}</h3>
      <p className={`mt-1.5 text-sm ${mBody}`}>{step.description}</p>
    </>
  );

  if (step.href) {
    return (
      <Link href={step.href} className={`group block ${className}`}>
        <span className="transition-colors group-hover:text-accent">{inner}</span>
      </Link>
    );
  }

  return <article className={className}>{inner}</article>;
}

/** Vertical executive architecture flow — SVG/CSS only, no internal service names. */
export function ExecutiveFlowDiagram({ steps, ariaLabel, headingId }: ExecutiveFlowDiagramProps) {
  return (
    <figure
      className="mx-auto max-w-md"
      role="group"
      aria-labelledby={headingId}
      aria-label={ariaLabel}
    >
      <ol className="relative space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.label} className="relative flex flex-col items-center">
              <StepCard step={step} />
              {!isLast ? (
                <div
                  className="flex h-9 flex-col items-center justify-center text-accent/40 motion-reduce:hidden"
                  aria-hidden
                >
                  <span className="h-5 w-px bg-gradient-to-b from-white/15 to-accent/50" />
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
                    <path
                      d="M6 7L1 2h10L6 7z"
                      fill="currentColor"
                      className="text-accent/60"
                    />
                  </svg>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
