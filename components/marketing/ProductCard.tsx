import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import type { EcosystemProduct } from "@/lib/company-identity";
import type { ProductMaturity } from "@/lib/ecosystem-graph";
import { mBody, mCardLink, mCardTitle, mLinkCta } from "@/lib/marketing-layout";

export function ProductCard({
  href,
  name,
  description,
  status,
  icon,
}: {
  href: string;
  name: string;
  description: string;
  status: ProductMaturity;
  icon: EcosystemProduct["icon"];
}) {
  return (
    <Link href={href} className={mCardLink}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] transition-colors group-hover:bg-accent/10">
          <AppIcon
            name={icon}
            size={22}
            className="text-primary-muted transition-colors group-hover:text-accent"
            aria-hidden
          />
        </div>
        <MaturityBadge maturity={status} />
      </div>
      <h2 className={`mt-4 ${mCardTitle}`}>{name}</h2>
      <p className={`mt-2 flex-1 ${mBody}`}>{description}</p>
      <span className={mLinkCta}>
        View product
        <AppIcon name="chevronRight" size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
