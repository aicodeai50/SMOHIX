import type { ReactNode } from "react";

import { IntelligenceField, SmohixHorizon } from "@/components/architecture";

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
    <div className="smohix-surface smohix-surface--aware relative overflow-hidden p-8 md:p-10">
      <IntelligenceField className="opacity-30" animate={false} />
      <div className="relative">
        <h1 className="smohix-headline text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
        <div className="mt-5 max-w-[12rem]">
          <SmohixHorizon />
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
