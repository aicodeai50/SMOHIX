"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { setAnalyticsConsent } from "@/lib/analytics";

function consentBannerNeeded(): boolean {
  if (process.env.NEXT_PUBLIC_ANALYTICS_REQUIRES_CONSENT !== "true") return false;
  try {
    return !localStorage.getItem("zentro_analytics_consent");
  } catch {
    return true;
  }
}

export function AnalyticsConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (consentBannerNeeded()) setVisible(true);
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="consent-heading"
      aria-describedby="consent-desc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/[0.1] bg-background/95 p-4 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id="consent-heading" className="text-sm font-semibold text-foreground">
            Analytics cookies
          </p>
          <p id="consent-desc" className="mt-1 text-xs text-muted">
            Optional analytics help us understand how visitors use zentro.run. Essential forms
            work without this.{" "}
            <Link href="/cookies" className="text-accent hover:underline">
              Cookie policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              setAnalyticsConsent(false);
              setVisible(false);
            }}
            className="rounded-lg border border-white/[0.12] px-3 py-2 text-xs font-medium hover:border-white/25"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => {
              setAnalyticsConsent(true);
              setVisible(false);
            }}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-background"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
