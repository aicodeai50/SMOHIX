import { Badge } from "@/components/ui/Badge";
import { maturityLabel, type ProductMaturity } from "@/lib/ecosystem-graph";
import { maturityBadgeVariant } from "@/lib/maturity-styles";

export function MaturityBadge({
  maturity,
  className = "",
  size = "sm",
}: {
  maturity: ProductMaturity;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <Badge
      variant={maturityBadgeVariant(maturity)}
      size={size}
      className={className}
      aria-label={`Product status: ${maturityLabel(maturity)}`}
    >
      {maturityLabel(maturity)}
    </Badge>
  );
}
