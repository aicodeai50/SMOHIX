import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  PLATFORM_STATUS,
  statusIndicator,
} from "@/lib/ecosystem-graph";
import { mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";

export function PlatformStatusSection() {
  return (
    <MarketingReveal
      id="platform-status"
      className={mSection}
      aria-labelledby="status-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Platform status</p>
        <h2 id="status-heading" className={`mt-2 ${mH2}`}>
          Live platform snapshot
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Static overview of ecosystem capabilities. For runtime service checks, see{" "}
          <Link href="/status" className="text-accent hover:underline">
            status
          </Link>
          .
        </p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_STATUS.map((item) => {
            const ind = statusIndicator(item.status);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/30"
                >
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className={`flex items-center gap-1.5 text-xs ${ind.className}`}>
                    <span aria-hidden>{ind.emoji}</span>
                    <span className="sr-only">{ind.label}</span>
                    <span className="hidden sm:inline">{ind.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </MarketingReveal>
  );
}
