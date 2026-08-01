"use client";

import { useEffect, useState } from "react";

import { mBody } from "@/lib/marketing-layout";

const STEPS = [
  { id: "user", label: "User", sub: "Operator, developer, or leader" },
  { id: "platform", label: "Zentro Platform", sub: "Incidents, approvals, audit" },
  { id: "ai", label: "AI Layer", sub: "Copilot & reasoning (server-side)" },
  { id: "products", label: "Products", sub: "API, Agents, Knowledge, Analytics…" },
  { id: "results", label: "Results", sub: "Evidence, exports, accountable ops" },
] as const;

export function HowZentroWorksJourney() {
  const [active, setActive] = useState(0);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % STEPS.length), 2800);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
      <svg
        viewBox="0 0 400 320"
        className="mx-auto w-full max-w-lg"
        role="img"
        aria-label="How Zentro works: user through platform, AI, products, to results"
      >
        <defs>
          <linearGradient id="jz-flow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.5)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.35)" />
          </linearGradient>
        </defs>
        {STEPS.map((step, i) => {
          const y = 28 + i * 58;
          const on = i <= active;
          return (
            <g key={step.id}>
              {i > 0 ? (
                <line
                  x1="200"
                  y1={y - 38}
                  x2="200"
                  y2={y - 14}
                  stroke={on ? "url(#jz-flow)" : "rgba(255,255,255,0.12)"}
                  strokeWidth="2"
                  strokeDasharray={on ? "0" : "4 4"}
                />
              ) : null}
              <rect
                x="120"
                y={y - 12}
                width="160"
                height="36"
                rx="10"
                fill={on ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)"}
                stroke={on ? "rgba(16,185,129,0.45)" : "rgba(255,255,255,0.1)"}
                strokeWidth="1.5"
              />
              <text
                x="200"
                y={y + 8}
                textAnchor="middle"
                fill={on ? "#e2e8f0" : "#94a3b8"}
                fontSize="13"
                fontWeight="600"
              >
                {step.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="mt-6 grid gap-2 sm:grid-cols-5">
        {STEPS.map((step, i) => (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className={`w-full rounded-lg border px-2 py-2 text-left text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                i === active
                  ? "border-accent/40 bg-accent/10 text-foreground"
                  : "border-white/[0.08] text-muted hover:border-white/[0.14]"
              }`}
              aria-current={i === active ? "step" : undefined}
            >
              <span className="font-semibold">{step.label}</span>
              <span className={`mt-0.5 block ${mBody}`}>{step.sub}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
