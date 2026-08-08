import Link from "next/link";

import { ARCHITECTURE_LAYERS } from "@/lib/ecosystem-graph";
import { mBody, mH3 } from "@/lib/marketing-layout";

export function ArchitectureDiagram() {
  return (
    <div className="mx-auto max-w-lg" role="img" aria-label="Smohix system architecture layers">
      <ol className="relative space-y-0">
        {ARCHITECTURE_LAYERS.map((layer, index) => {
          const isLast = index === ARCHITECTURE_LAYERS.length - 1;
          return (
            <li key={layer.id} className="relative flex flex-col items-center">
              <Link
                href={layer.href}
                className="group w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-muted/40 hover:bg-primary-dim/30 hover:shadow-[0_0_24px_-8px_rgba(99,102,241,0.35)]"
              >
                <h3 className={`${mH3} text-base group-hover:text-accent`}>{layer.label}</h3>
                <p className={`mt-1.5 text-sm ${mBody}`}>{layer.detail}</p>
              </Link>
              {!isLast ? (
                <div
                  className="flex h-8 flex-col items-center justify-center text-primary-muted/50"
                  aria-hidden
                >
                  <span className="h-4 w-px bg-gradient-to-b from-white/20 to-primary-muted/40" />
                  <span className="text-xs">▼</span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
