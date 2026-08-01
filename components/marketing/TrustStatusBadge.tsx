import { Badge } from "@/components/ui/Badge";
import { trustBadgeVariant } from "@/lib/maturity-styles";
import { trustStatusLabel, type TrustStatus } from "@/lib/trust-center";

export function TrustStatusBadge({
  status,
  className = "",
}: {
  status: TrustStatus;
  className?: string;
}) {
  return (
    <Badge variant={trustBadgeVariant(status)} className={className}>
      {trustStatusLabel(status)}
    </Badge>
  );
}
