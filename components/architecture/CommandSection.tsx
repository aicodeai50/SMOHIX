import type { ReactNode } from "react";

import { appBody, appOverline, appPanelTitle } from "@/lib/app-typography";

/** Command environment section — shared ops grammar for Hub and modules. */
export function CommandSection({
  id,
  title,
  description,
  children,
  actions,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section className="smohix-command-section" aria-labelledby={headingId} id={id}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={appOverline}>Command</p>
          <h2 id={headingId} className={`${appPanelTitle} mt-1`}>
            {title}
          </h2>
          {description ? <p className={`mt-1 max-w-2xl ${appBody} text-muted`}>{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
