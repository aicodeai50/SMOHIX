import Link from "next/link";
import type { ReactNode } from "react";

import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";

export type EmptyCta = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export function ConsoleEmptyState({
  title,
  description,
  ctas,
  footnote,
}: {
  title: string;
  description: string;
  ctas?: EmptyCta[];
  footnote?: ReactNode;
}) {
  return (
    <div className="smohix-surface smohix-surface--dormant rounded-2xl border-dashed px-6 py-12 text-center sm:px-10">
      <h3 className={appPanelTitle}>{title}</h3>
      <p className={`mx-auto mt-2 max-w-md text-muted ${appBody}`}>{description}</p>
      {ctas?.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {ctas.map((c) =>
            c.variant === "secondary" ? (
              <Link
                key={c.href}
                href={c.href}
                className={`inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.12] px-4 font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
              >
                {c.label}
              </Link>
            ) : (
              <Link
                key={c.href}
                href={c.href}
                className={`inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-background transition-opacity hover:opacity-90 ${appBody}`}
              >
                {c.label}
              </Link>
            ),
          )}
        </div>
      ) : null}
      {footnote ? <div className={`mt-6 ${appMeta}`}>{footnote}</div> : null}
    </div>
  );
}
