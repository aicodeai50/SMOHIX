import Link from "next/link";

import { SmohixHorizon } from "@/components/architecture";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { Button } from "@/components/ui/Button";
import { FLAGSHIP_PRODUCTS } from "@/lib/ecosystem-workspaces";
import type { ProductMaturity } from "@/lib/ecosystem-graph";
import { mBody, mBodySm, mFocusRing, mSystemMeta } from "@/lib/marketing-layout";
import {
  getRegistryProduct,
  registryToEcosystemStatus,
  type ProductAction,
  type ProductRegistryEntry,
} from "@/lib/product-registry";

function nodeRole(id: string): "core" | "flagship" | "preview" {
  if (id === "smohix-platform") return "core";
  if (id === "smohix-ai") return "flagship";
  return "preview";
}

function roleLabel(role: ReturnType<typeof nodeRole>): string {
  if (role === "core") return "Operating core";
  if (role === "flagship") return "Flagship intelligence";
  return "Preview workspace";
}

function displayMaturity(product: ProductRegistryEntry): ProductMaturity {
  const flagship = FLAGSHIP_PRODUCTS.find((p) => p.id === product.id);
  if (flagship) return flagship.status;
  return registryToEcosystemStatus(product.maturity);
}

function ActionControl({ action }: { action: ProductAction }) {
  const isPrimary = action.kind === "open_product" || action.kind === "sign_in";
  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={mFocusRing}>
        <Button size="sm" variant={isPrimary ? "primary" : "secondary"}>
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

function EcosystemNode({ product }: { product: ProductRegistryEntry }) {
  const role = nodeRole(product.id);
  const primaryActions = product.availableActions.filter(
    (a) => a.kind === "open_product" || a.kind === "sign_in",
  );
  const secondaryActions = product.availableActions.filter(
    (a) => a.kind !== "open_product" && a.kind !== "sign_in",
  );

  return (
    <article
      className={`smohix-ecosystem-node smohix-ecosystem-node--${role} smohix-surface smohix-surface--aware`}
      data-product={product.id}
    >
      {role === "flagship" ? <div className="smohix-ecosystem-node__intel-field" aria-hidden /> : null}
      <div className="smohix-ecosystem-node__header">
        <div className="min-w-0">
          <p className={`${mSystemMeta} ${role === "preview" ? "text-muted/70" : "text-accent/75"}`}>
            {roleLabel(role)}
          </p>
          <h2 className="smohix-ecosystem-node__title">{product.publicName}</h2>
        </div>
        <MaturityBadge maturity={displayMaturity(product)} />
      </div>
      <p className={`mt-3 ${mBody} smohix-ecosystem-node__body`}>{product.description}</p>
      {role !== "preview" && product.capabilities.length > 0 ? (
        <ul className="smohix-ecosystem-node__signals" aria-label={`${product.publicName} capabilities`}>
          {product.capabilities.slice(0, role === "core" ? 3 : 2).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {primaryActions.map((action) => (
          <ActionControl key={`${action.kind}-${action.href}`} action={action} />
        ))}
      </div>
      {secondaryActions.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {secondaryActions.map((action) => (
            <li key={`${action.kind}-${action.href}`}>
              <ActionControl action={action} />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

/** Flagship product architecture — registry data, ecosystem spatial composition. */
export function ProductEcosystemField() {
  const platform = getRegistryProduct("smohix-platform")!;
  const ai = getRegistryProduct("smohix-ai")!;
  const assistant = getRegistryProduct("smohix-assistant")!;
  const pri = getRegistryProduct("private-ai")!;

  return (
    <div className="smohix-product-ecosystem-field smohix-ecosystem-field">
      <div className="smohix-ecosystem-field__spine" aria-hidden>
        <SmohixHorizon className="mx-auto max-w-md" />
        <p className={`mt-3 text-center ${mSystemMeta} text-muted/75`}>
          Smohix Technologies HQ · product architecture
        </p>
        <div className="smohix-product-ecosystem-field__hq-axis" aria-hidden />
      </div>

      <div className="smohix-ecosystem-field__platform">
        <EcosystemNode product={platform} />
      </div>

      <div className="smohix-ecosystem-field__link smohix-product-ecosystem-field__link" aria-hidden>
        <span className="smohix-product-ecosystem-field__link-arm smohix-product-ecosystem-field__link-arm--platform" />
        <span className="smohix-product-ecosystem-field__link-arm smohix-product-ecosystem-field__link-arm--ai" />
      </div>

      <div className="smohix-ecosystem-field__ai">
        <EcosystemNode product={ai} />
      </div>

      <div className="smohix-ecosystem-field__previews">
        <div className="smohix-ecosystem-field__preview-pair">
          <EcosystemNode product={assistant} />
          <EcosystemNode product={pri} />
        </div>
        <p className={`mt-4 ${mBodySm} text-muted/80`}>
          Preview workspaces share HQ identity — maturity labels reflect current availability.
        </p>
      </div>
    </div>
  );
}
