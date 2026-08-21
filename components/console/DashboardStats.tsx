import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { Card } from "@/components/ui/Card";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
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
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <Link key={s.label} href={s.href} className="group block">
          <Card className="transition-[border-color,transform] group-hover:-translate-y-0.5 group-hover:border-accent/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`${appMeta} uppercase tracking-wide text-muted`}>{s.label}</p>
                <p className={`mt-2 ${s.isText ? appPanelTitle : "text-3xl font-bold"} text-foreground`}>
                  {s.value}
                </p>
              </div>
              <AppIcon name={s.icon} size={20} className="text-accent/80" aria-hidden />
            </div>
          </Card>
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
    <section className="mt-6">
      <h2 className={appPanelTitle}>Quick actions</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 ${appBody} transition-colors hover:border-accent/35 hover:bg-accent/[0.04]`}
          >
            <AppIcon name={a.icon} size={18} className="text-accent" />
            <span className="font-medium text-foreground/90">{a.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
