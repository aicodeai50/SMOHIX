import Link from "next/link";

import { SmohixHorizon } from "@/components/architecture";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { Button } from "@/components/ui/Button";
import { FLAGSHIP_PRODUCTS } from "@/lib/ecosystem-workspaces";
import { mBody, mBodySm, mFocusRing, mSystemMeta } from "@/lib/marketing-layout";

function isExternalWorkspace(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

type Product = (typeof FLAGSHIP_PRODUCTS)[number];

function nodeRole(id: Product["id"]): "core" | "flagship" | "preview" {
  if (id === "smohix-platform") return "core";
  if (id === "smohix-ai") return "flagship";
  return "preview";
}

function openLabel(product: Product): string {
  if (product.id === "smohix-platform") return "Open Hub";
  if (product.id === "smohix-ai") return "Open Smohix AI ↗";
  return "Open workspace ↗";
}

function ProductNode({ product }: { product: Product }) {
  const role = nodeRole(product.id);
  const external = isExternalWorkspace(product.workspaceUrl);

  return (
    <article
      className={`smohix-ecosystem-node smohix-ecosystem-node--${role} smohix-surface smohix-surface--aware`}
      data-product={product.id}
    >
      <div className="smohix-ecosystem-node__header">
        <div className="min-w-0">
          {role === "core" ? (
            <p className={`${mSystemMeta} text-accent/75`}>Operating core</p>
          ) : null}
          {role === "flagship" ? (
            <p className={`${mSystemMeta} text-accent/75`}>Flagship intelligence</p>
          ) : null}
          {role === "preview" ? (
            <p className={`${mSystemMeta} text-muted/70`}>Preview workspace</p>
          ) : null}
          <h3 className="smohix-ecosystem-node__title">{product.name}</h3>
        </div>
        <MaturityBadge maturity={product.status} />
      </div>
      <p className={`mt-3 ${mBody} smohix-ecosystem-node__body`}>{product.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={product.href} className={mFocusRing}>
          <Button size="sm" variant="secondary">
            Overview
          </Button>
        </Link>
        {external ? (
          <a href={product.workspaceUrl} target="_blank" rel="noopener noreferrer" className={mFocusRing}>
            <Button size="sm">{openLabel(product)}</Button>
          </a>
        ) : (
          <Link href={product.workspaceUrl} className={mFocusRing}>
            <Button size="sm">{openLabel(product)}</Button>
          </Link>
        )}
      </div>
    </article>
  );
}

/** Homepage Smohix ecosystem — asymmetric constellation, not equal card grid. */
export function EcosystemConstellation() {
  const platform = FLAGSHIP_PRODUCTS.find((p) => p.id === "smohix-platform")!;
  const ai = FLAGSHIP_PRODUCTS.find((p) => p.id === "smohix-ai")!;
  const assistant = FLAGSHIP_PRODUCTS.find((p) => p.id === "smohix-assistant")!;
  const pri = FLAGSHIP_PRODUCTS.find((p) => p.id === "private-ai")!;

  return (
    <div className="smohix-ecosystem-field">
      <div className="smohix-ecosystem-field__spine" aria-hidden>
        <SmohixHorizon className="mx-auto max-w-md" />
        <p className={`mt-3 text-center ${mSystemMeta} text-muted/75`}>Product workspaces · one ecosystem</p>
      </div>

      <div className="smohix-ecosystem-field__platform">
        <ProductNode product={platform} />
      </div>

      <div className="smohix-ecosystem-field__link" aria-hidden />

      <div className="smohix-ecosystem-field__ai">
        <ProductNode product={ai} />
      </div>

      <div className="smohix-ecosystem-field__previews">
        <div className="smohix-ecosystem-field__preview-pair">
          <ProductNode product={assistant} />
          <ProductNode product={pri} />
        </div>
        <p className={`mt-4 ${mBodySm} text-muted/80`}>
          Preview workspaces share HQ identity — maturity labels reflect current availability.
        </p>
      </div>
    </div>
  );
}
