import { BRAND_PRODUCT_NAMES, type BrandProductName } from "@/lib/brand";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

import { ZentroMark } from "./ZentroMark";

type BrandLogoProps = {
  className?: string;
  /** Product label beside the mark. Defaults to "Zentro". */
  productName?: BrandProductName | string;
  /** Hide the wordmark and show only the official mark. */
  markOnly?: boolean;
  /** Mark pixel size. Default 32. */
  markSize?: number;
};

/**
 * Official Zentro logo — mark + optional product name.
 * Every surface (marketing, console, auth, admin, mobile) should use this component.
 */
export function BrandLogo({
  className = "",
  productName = SITE_BRAND_NAME,
  markOnly = false,
  markSize = 32,
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ZentroMark size={markSize} />
      {!markOnly ? (
        <span className="whitespace-nowrap text-xl font-bold tracking-tight text-foreground">
          {productName}
        </span>
      ) : null}
    </div>
  );
}

export { BRAND_PRODUCT_NAMES };
