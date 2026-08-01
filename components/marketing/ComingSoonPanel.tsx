import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { mBody } from "@/lib/marketing-layout";

export function ComingSoonPanel({
  title,
  description,
  backHref = "/products",
  backLabel = "All products",
}: {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.1] bg-white/[0.02] p-8 text-center sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-muted">
        Coming soon
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-foreground">{title}</h2>
      <p className={`mx-auto mt-3 max-w-lg ${mBody}`}>{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href={backHref}>
          <Button variant="secondary">{backLabel}</Button>
        </Link>
        <Link href="/contact">
          <Button>Contact us</Button>
        </Link>
      </div>
    </div>
  );
}
