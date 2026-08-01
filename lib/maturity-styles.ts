import type { ProductMaturity } from "@/lib/ecosystem-graph";
import type { TrustStatus } from "@/lib/trust-center";

/** Maps product maturity to shared badge variant tokens. */
export type MaturityBadgeVariant = "live" | "preview" | "planned";

export function maturityBadgeVariant(m: ProductMaturity): MaturityBadgeVariant {
  switch (m) {
    case "live":
      return "live";
    case "preview":
    case "prototype":
      return "preview";
    case "coming-soon":
      return "planned";
  }
}

export type TrustBadgeVariant = "trust-current" | "trust-progress" | "trust-planned";

export function trustBadgeVariant(status: TrustStatus): TrustBadgeVariant {
  switch (status) {
    case "current":
      return "trust-current";
    case "in-progress":
      return "trust-progress";
    case "planned":
      return "trust-planned";
  }
}
