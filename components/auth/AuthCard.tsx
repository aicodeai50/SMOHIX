import type { ReactNode } from "react";

import { SmohixHorizon, SmohixSurface } from "@/components/architecture";

/**
 * Auth form shell — Living Architecture surface + Horizon.
 * Ambient field lives on the auth layout only (avoid double atmosphere).
 */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <SmohixSurface tone="aware" className="p-8 md:p-10">
      <h1 className="smohix-headline text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
      <div className="mt-5 max-w-[11rem]">
        <SmohixHorizon />
      </div>
      <div className="mt-8">{children}</div>
    </SmohixSurface>
  );
}
