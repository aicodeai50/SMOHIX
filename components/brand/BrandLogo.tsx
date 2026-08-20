import { BRAND_PRODUCT_NAMES } from "@/lib/brand";

import { SmohixHqWordmark, type SmohixHqWordmarkProps } from "./hq/SmohixHqWordmark";

export type BrandLogoProps = Omit<SmohixHqWordmarkProps, "symbolSize" | "height"> & {
  /** Symbol height in px — default fits h-16 header. */
  height?: number;
};

/**
 * Official Smohix HQ corporate logo — Flow Mark S + Smohix brand wordmark.
 * Used across marketing, console, auth, and admin surfaces on smohix.run.
 */
export function BrandLogo({
  className = "",
  tone = "dark",
  height = 28,
  decorative = false,
  ...rest
}: BrandLogoProps) {
  return (
    <SmohixHqWordmark
      tone={tone}
      symbolSize={height}
      decorative={decorative}
      className={className}
      {...rest}
    />
  );
}

export { BRAND_PRODUCT_NAMES };
