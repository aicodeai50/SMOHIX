import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { appMetric, appPanelTitle, appSignal } from "@/lib/app-typography";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DashboardStats({ userId }: { userId: string | null }) {
  let openIncidents = 0;
  let totalIncidents = 0;
  let pendingApprovals = 0;
  let planLabel = "Free";

  if (userId && hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const [incidents, approvals, sub] = await Promise.all([
        supabase
          .from("incidents")
          .select("id, status", { count: "exact" })
          .eq("user_id", userId),
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

      totalIncidents = incidents.count ?? 0;
      openIncidents =
        incidents.data?.filter((i) => i.status !== "resolved" && i.status !== "closed")
          .length ?? 0;
      pendingApprovals = approvals.count ?? 0;
      if (sub.data?.status && !["cancelled", "expired"].includes(sub.data.status)) {
        planLabel = "Paid";
      }
    } catch {
      /* local demo mode */
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
      label: "Plan",
      value: planLabel,
      href: "/settings/billing",
      icon: "creditCard" as const,
      isText: true,
    },
  ];

  return (
    <div className="smohix-metric-band-grid mt-4">
      {stats.map((s) => (
        <Link key={s.label} href={s.href} className="group block">
          <div className="smohix-metric-band h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`${appSignal} text-muted`}>{s.label}</p>
                <p className={`mt-2 ${s.isText ? appPanelTitle : appMetric}`}>{s.value}</p>
              </div>
              <AppIcon name={s.icon} size={20} className="text-accent/80" aria-hidden />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function QuickActions() {
  const actions = [
    { href: "/incidents/new", label: "Create incident", icon: "alertTriangle" as const },
    { href: "/services#svc-name", label: "Add service", icon: "server" as const },
    { href: "/automations", label: "Create automation", icon: "workflow" as const },
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
