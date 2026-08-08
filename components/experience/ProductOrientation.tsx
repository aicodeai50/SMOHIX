"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/Button";
import { getAllRegistryProducts, registryMaturityLabel } from "@/lib/product-registry";
import { mBody, mFocusRing, mH3 } from "@/lib/marketing-layout";

const STEPS = [
  {
    id: "company",
    title: "Smohix Technologies",
    body: "Smohix.run is the public front door to all Smohix Technologies products — honest maturity labels, no invented metrics.",
    href: "/company",
    cta: "About the company",
  },
  {
    id: "products",
    title: "Product Access",
    body: "Open live products, sign in to the console, or follow planned work — every action links to a real destination.",
    href: "/products",
    cta: "Product Access",
  },
  {
    id: "ai",
    title: "Smohix AI",
    body: "The standalone AI product lives at ai.smohix.run. Console Copilot uses same-origin /api/copilot/chat when signed in.",
    href: "https://ai.smohix.run",
    cta: "Open Smohix AI",
    external: true,
  },
  {
    id: "developers",
    title: "Developers",
    body: "API catalog, authentication patterns, and copyable request examples — matched to documented routes only.",
    href: "/developers",
    cta: "Developer hub",
  },
  {
    id: "architecture",
    title: "Architecture",
    body: "How smohix.run, APIs, and optional backends connect — private URLs stay server-side.",
    href: "/architecture",
    cta: "View architecture",
  },
  {
    id: "trust",
    title: "Trust & pilots",
    body: "Security, privacy, and pilot programs with transparent availability — no unverified certification claims.",
    href: "/trust",
    cta: "Trust center",
  },
] as const;

export function ProductOrientation() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const total = STEPS.length;
  const products = getAllRegistryProducts();

  const go = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(next, total - 1))),
    [total],
  );

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-muted">
          Step {index + 1} of {total}
        </p>
        <Link href="/products" className={`text-xs ${mFocusRing} text-muted hover:text-accent`}>
          Skip to Product Access
        </Link>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <h2 className={`mt-8 ${mH3}`}>{step.title}</h2>
      <p className={`mt-3 max-w-2xl ${mBody}`}>{step.body}</p>
      {"external" in step && step.external ? (
        <a
          href={step.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-4 inline-block text-sm font-medium text-accent hover:underline ${mFocusRing}`}
        >
          {step.cta} ↗
        </a>
      ) : (
        <Link
          href={step.href}
          className={`mt-4 inline-block text-sm font-medium text-accent hover:underline ${mFocusRing}`}
        >
          {step.cta} →
        </Link>
      )}

      {index === 1 && products.length > 0 ? (
        <ul className={`mt-6 space-y-2 ${mBody}`}>
          {products.map((p) => (
            <li key={p.id} className="flex justify-between gap-2 text-sm">
              <span>{p.publicName}</span>
              <span className="text-muted">{registryMaturityLabel(p.maturity)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="secondary" size="md" disabled={index === 0} onClick={() => go(index - 1)}>
          Previous
        </Button>
        {index < total - 1 ? (
          <Button size="md" onClick={() => go(index + 1)}>
            Next
          </Button>
        ) : (
          <Link href="/pilot">
            <Button size="md">Finish — apply for pilot</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
