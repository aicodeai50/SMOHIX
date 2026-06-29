"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

type Tier = "pro" | "team" | "top_up";

export function BillingCheckoutActions({
  tier,
  label,
  variant = "primary",
  topUpAmount,
}: {
  tier: Tier;
  label: string;
  variant?: "primary" | "secondary";
  topUpAmount?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          ...(topUpAmount ? { topUpAmountCents: Math.round(topUpAmount * 100) } : {}),
        }),
      });
      const data = (await res.json()) as { approvalUrl?: string; error?: string };
      if (!res.ok || !data.approvalUrl) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      window.location.href = data.approvalUrl;
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        variant={variant}
        onClick={startCheckout}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? "Redirecting…" : label}
      </Button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
