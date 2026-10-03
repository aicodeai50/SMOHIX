import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { appMetric, appPanelTitle, appSignal } from "@/lib/app-typography";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { confirmedMetricCount } from "@/lib/console/metric-state";

export async function DashboardStats({ userId }: { userId: string | null }) {
  let openIncidents: number | null = null;
  let totalIncidents: number | null = null;
  let pendingApprovals: number | null = null;
  let planLabel: string | null = null;

  if (userId && hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const [incidents, open, approvals, sub] = await Promise.all([
        supabase
          .from("incidents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("incidents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .not("status", "in", "(resolved,closed)"),
        supabase
          .from("approval_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "pending"),
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      totalIncidents = confirmedMetricCount(incidents);
      openIncidents = confirmedMetricCount(open);
      pendingApprovals = confirmedMetricCount(approvals);
      if (!sub.error) planLabel = sub.data?.status && !["cancelled", "expired"].includes(sub.data.status) ? "Paid" : "Free";
    } catch {
      /* Unavailable data must not look like a confirmed empty workspace. */
    }
  }

  const stats = [
    {
      label: "Open incidents",
      value: openIncidents,
      href: "/incidents",
      icon: "alertTriangle" as const,
    },
    {
      label: "Total incidents",
      value: totalIncidents,
      href: "/incidents",
      icon: "scrollText" as const,
    },
    {
      label: "Pending approvals",
      value: pendingApprovals,
      href: "/approvals",
      icon: "shieldCheck" as const,
    },
    {
      label: "Subscription",
      value: planLabel,
      href: "/settings/billing",
      icon: "creditCard" as const,
      isText: true,
    },
  ];

  return (
    <>
    <div className="smohix-metric-band-grid mt-4">
      {stats.map((s) => (
        <Link key={s.label} href={s.href} className="group block">
          <div className="smohix-metric-band h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`${appSignal} text-muted`}>{s.label}</p>
                <p className={`mt-2 ${s.isText || s.value === null ? appPanelTitle : appMetric}`}>{s.value ?? 'Unavailable'}</p>
              </div>
              <AppIcon name={s.icon} size={20} className="text-accent/80" aria-hidden />
            </div>
          </div>
        </Link>
      ))}
    </div>
    {stats.some((stat) => stat.value === null) && <p className="mt-3 text-sm text-muted" role="status">
      {userId ? 'Some workspace data could not be loaded. Open the relevant section to retry.' : 'Sign in to view recorded workspace metrics.'}
    </p>}
    </>
  );
}

export function QuickActions() {
  const actions = [
    { href: "/incidents/new", label: "Create incident", icon: "alertTriangle" as const },
    { href: "/services#svc-name", label: "Add service", icon: "server" as const },
    { href: "/automations", label: "Review automations", icon: "workflow" as const },
    { href: "/copilot", label: "Open Copilot", icon: "bot" as const },
  ];

  return (
    <section className="mt-2">
      <div className="smohix-action-rail">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="smohix-action-rail__item">
            <AppIcon name={a.icon} size={18} className="text-accent" />
            <span>{a.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
