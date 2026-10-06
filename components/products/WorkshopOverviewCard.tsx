import Link from "next/link";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { getRegistryProduct, registryToEcosystemStatus } from "@/lib/product-registry";
import { mBody, mFocusRing, mSystemMeta } from "@/lib/marketing-layout";
import { WORKSHOP_CONTACT_PATH } from "@/lib/workshop-content";

export function WorkshopOverviewCard() {
  const product = getRegistryProduct("smohix-workshop");
  if (!product) return null;
  return (
    <article className="smohix-workshop-entry smohix-surface smohix-surface--aware" data-product={product.id}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`${mSystemMeta} text-accent/80`}>Project delivery · by Smohix</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{product.publicName}</h3>
        </div>
        <MaturityBadge maturity={registryToEcosystemStatus(product.maturity)} />
      </div>
      <p className={`mt-3 max-w-2xl ${mBody}`}>{product.description}</p>
      <p className={`mt-2 ${mBody}`}>Define → Design → Build → Launch</p>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-medium">
        <Link href={product.productPagePath} className={`smohix-workshop-link ${mFocusRing}`}>Explore Workshop →</Link>
        <Link href={WORKSHOP_CONTACT_PATH} className={`text-accent hover:underline ${mFocusRing}`}>Discuss a project</Link>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">Project inquiries are open. The dedicated client workspace is planned.</p>
    </article>
  );
}
