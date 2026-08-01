import Link from "next/link";

import {
  fetchProductStatuses,
  statusLabel,
  statusToneClass,
} from "@/lib/status/adapters";
import { mBody, mBodySm } from "@/lib/marketing-layout";

export async function RealStatusPanel() {
  const statuses = await fetchProductStatuses();
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {statuses.map((item) => (
        <li key={item.productId} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href={item.href} className="font-semibold text-foreground hover:text-accent">
              {item.label}
            </Link>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusToneClass(item.status)}`}
            >
              {statusLabel(item.status)}
            </span>
          </div>
          <p className={`mt-2 ${mBody}`}>{item.detail}</p>
          <p className={`mt-2 ${mBodySm}`}>
            Last checked: {new Date(item.lastChecked).toLocaleString("en-US", { timeZone: "UTC" })} UTC
          </p>
        </li>
      ))}
    </ul>
  );
}
