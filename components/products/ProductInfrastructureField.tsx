import Link from "next/link";

import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { Button } from "@/components/ui/Button";
import { isFlagshipProduct } from "@/lib/ecosystem-workspaces";
import { mBody, mBodySm, mFocusRing, mSystemMeta } from "@/lib/marketing-layout";
import {
  getAllRegistryProducts,
  registryToEcosystemStatus,
  type ProductAction,
  type ProductRegistryEntry,
  type RegistryMaturity,
} from "@/lib/product-registry";

function infraMass(maturity: RegistryMaturity): "live" | "emerging" | "planned" {
  if (maturity === "live") return "live";
  if (maturity === "planned") return "planned";
  return "emerging";
}

function ActionControl({ action, compact }: { action: ProductAction; compact?: boolean }) {
  const isPrimary = action.kind === "open_product" || action.kind === "sign_in";
  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={mFocusRing}>
        <Button size={compact ? "sm" : "sm"} variant={isPrimary ? "primary" : "secondary"}>
          {action.label}
          {isPrimary ? " ↗" : ""}
        </Button>
      </a>
    );
  }
  if (isPrimary) {
    return (
      <Link href={action.href} className={mFocusRing}>
        <Button size="sm">{action.label}</Button>
      </Link>
    );
  }
  return (
    <Link href={action.href} className={`text-sm font-medium text-accent hover:underline ${mFocusRing}`}>
      {action.label} →
    </Link>
  );
}

function InfraNode({ product }: { product: ProductRegistryEntry }) {
  const mass = infraMass(product.maturity);
  const primaryActions = product.availableActions.filter(
    (a) => a.kind === "open_product" || a.kind === "sign_in",
  );
  const secondaryActions = product.availableActions.filter(
    (a) => a.kind !== "open_product" && a.kind !== "sign_in",
  );

  return (
    <article
      className={`smohix-product-infra-node smohix-product-infra-node--${mass} smohix-surface smohix-surface--aware`}
      data-product={product.id}
    >
      <div className="smohix-product-infra-node__header">
        <div className="min-w-0">
          <p className={`${mSystemMeta} text-muted/65`}>
            {mass === "live" ? "Shared infrastructure" : mass === "planned" ? "Planned capability" : "Emerging module"}
          </p>
          <h3 className="smohix-product-infra-node__title">{product.publicName}</h3>
        </div>
        <MaturityBadge maturity={registryToEcosystemStatus(product.maturity)} size="sm" />
      </div>
      <p className={`mt-2.5 ${mass === "planned" ? mBodySm : mBody}`}>{product.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        {primaryActions.map((action) => (
          <ActionControl key={`${action.kind}-${action.href}`} action={action} compact={mass !== "live"} />
        ))}
      </div>
      {secondaryActions.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {secondaryActions.slice(0, mass === "planned" ? 2 : 3).map((action) => (
            <li key={`${action.kind}-${action.href}`}>
              <ActionControl action={action} compact />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

/** Extended registry products — architecture planes, not equal card grid. */
export function ProductInfrastructureField() {
  const products = getAllRegistryProducts()
    .filter((p) => !isFlagshipProduct(p.id))
    .sort((a, b) => {
      const order = { live: 0, preview: 1, prototype: 2, internal: 3, planned: 4 } as const;
      const diff = order[a.maturity] - order[b.maturity];
      if (diff !== 0) return diff;
      return a.publicName.localeCompare(b.publicName);
    });

  return (
    <section className="smohix-product-infra-field" aria-labelledby="product-infra-heading">
      <div className="smohix-product-infra-field__intro">
        <div className="smohix-product-infra-field__rail" aria-hidden />
        <div>
          <p className={`${mSystemMeta} text-accent/70`}>Control layer · platform modules</p>
          <h2 id="product-infra-heading" className="smohix-product-infra-field__heading">
            Extended ecosystem capabilities
          </h2>
          <p className={`mt-2 max-w-2xl ${mBodySm} text-muted/85`}>
            APIs, identity, analytics, and platform modules — same Smohix architecture with honest maturity
            labels for each surface.
          </p>
        </div>
      </div>
      <div className="smohix-product-infra-field__grid">
        {products.map((product) => (
          <InfraNode key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
