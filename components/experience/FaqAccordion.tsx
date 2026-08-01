"use client";

import { useState } from "react";

import { FAQ_GROUPS } from "@/lib/experience/faq";
import { mBody } from "@/lib/marketing-layout";

export function FaqAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      {FAQ_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`faq-${group.id}`}>
          <h2 id={`faq-${group.id}`} className="text-xl font-semibold text-foreground">
            {group.title}
          </h2>
          <ul className="mt-4 space-y-2">
            {group.items.map((item, i) => {
              const id = `${group.id}-${i}`;
              const open = openId === id;
              return (
                <li key={id} className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
                  <button
                    type="button"
                    id={`${id}-btn`}
                    aria-expanded={open}
                    aria-controls={`${id}-panel`}
                    onClick={() => setOpenId(open ? null : id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {item.q}
                    <span className="text-muted" aria-hidden>
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open ? (
                    <div
                      id={`${id}-panel`}
                      role="region"
                      aria-labelledby={`${id}-btn`}
                      className={`border-t border-white/[0.06] px-4 py-3 ${mBody}`}
                    >
                      {item.a}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
