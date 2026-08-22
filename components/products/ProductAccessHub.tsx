import { ProductEcosystemField } from "@/components/products/ProductEcosystemField";
import { ProductInfrastructureField } from "@/components/products/ProductInfrastructureField";
import { mBodySm, mSystemMeta } from "@/lib/marketing-layout";

export function ProductAccessHub() {
  return (
    <div className="smohix-product-access-hub">
      <ProductEcosystemField />

      <ProductInfrastructureField />

      <div className="smohix-product-maturity-context">
        <p className={`${mSystemMeta} text-muted/70`}>Maturity · availability</p>
        <p className={`mt-2 max-w-2xl ${mBodySm} text-muted/85`}>
          Live products are production-ready workspaces. Preview and prototype labels indicate early or
          limited availability. Planned items describe direction — not shipped GA features. Every card links
          to a real destination with current status.
        </p>
      </div>
    </div>
  );
}
