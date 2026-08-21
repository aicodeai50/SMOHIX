import Link from "next/link";

import { SmohixHorizon } from "@/components/architecture";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { Button } from "@/components/ui/Button";
import { isFlagshipProduct } from "@/lib/ecosystem-workspaces";
import {
  getAllRegistryProducts,
  registryMaturityLabel,
  registryToEcosystemStatus,
  type ProductAction,
  type ProductRegistryEntry,
} from "@/lib/product-registry";
import { mBody, mBodySm, mFocusRing } from "@/lib/marketing-layout";

function ActionLink({ action }: { action: ProductAction }) {
  const className = `text-sm font-medium text-accent hover:underline ${mFocusRing}`;
  if (action.external) {
    return (
      <a href={action.href} className={className} target="_blank" rel="noopener noreferrer">
        {action.label} ↗
      </a>
    );
  }
  if (action.kind === "sign_in" || action.kind === "open_product") {
    return (
      <Link href={action.href}>
        <Button size="sm" variant={action.kind === "open_product" ? "primary" : "secondary"}>
          {action.label}
        </Button>
      </Link>
    );
  }
  return (
    <Link href={action.href} className={className}>
      {action.label} →
    </Link>
  );
}

function ProductAccessCard({ product }: { product: ProductRegistryEntry }) {
  const primaryActions = product.availableActions.filter(
    (a) => a.kind === "open_product" || a.kind === "sign_in",
  );
  const secondaryActions = product.availableActions.filter(
    (a) => a.kind !== "open_product" && a.kind !== "sign_in",
  );

  return (
    <article className="smohix-surface smohix-surface--aware p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{product.publicName}</h2>
          <p className={`mt-1 ${mBodySm}`}>{registryMaturityLabel(product.maturity)}</p>
        </div>
        <MaturityBadge maturity={registryToEcosystemStatus(product.maturity)} />
      </div>
      <p className={`mt-3 ${mBody}`}>{product.description}</p>
      {product.productUrl && product.maturity !== "planned" ? (
        <p className={`mt-2 font-mono text-xs text-muted`}>
          {product.productUrl.startsWith("http") ? product.productUrl : product.productUrl.replace(/^https?:\/\/[^/]+/, "")}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {primaryActions.map((action) => (
          <ActionLink key={`${action.kind}-${action.href}`} action={action} />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {secondaryActions.map((action) => (
          <li key={`${action.kind}-${action.href}`}>
            <ActionLink action={action} />
          </li>
        ))}
      </ul>
      {product.limitations.length > 0 ? (
        <p className={`mt-4 border-t border-white/[0.06] pt-3 ${mBodySm}`}>
          {product.limitations[0]}
        </p>
      ) : null}
    </article>
  );
}

export function ProductAccessHub() {
  const products = [...getAllRegistryProducts()].sort((a, b) => {
    const aFlag = isFlagshipProduct(a.id) ? 0 : 1;
    const bFlag = isFlagshipProduct(b.id) ? 0 : 1;
    if (aFlag !== bFlag) return aFlag - bFlag;
    return a.publicName.localeCompare(b.publicName);
  });
  return (
    <div>
      <div className="mb-8 max-w-lg">
        <SmohixHorizon />
        <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-muted/70">
          HQ · AI · ASSISTANT · PRI · PLATFORM
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {products.map((product) => (
          <ProductAccessCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
