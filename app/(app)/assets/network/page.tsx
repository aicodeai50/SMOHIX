import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { listNetworkDevicesForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { createNetworkDeviceAction, deleteNetworkDeviceAction } from "./actions";

export const metadata: Metadata = {
  title: "Network assets",
  description: "Track network devices and firmware posture.",
};

export const dynamic = "force-dynamic";

export default async function NetworkAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Network assets"
          description="Connect Supabase and sign in to track network inventory and drift posture."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>Local mode does not persist network inventory.</p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/assets/network");
  }

  const rows = await listNetworkDevicesForUser(user.id);
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title="Network assets"
        description="Maintain inventory for routers, switches, firewalls, and access points before drift becomes outage risk."
      />
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderCard title="Add network device">
          <form action={createNetworkDeviceAction} className="space-y-3">
            <div>
              <label htmlFor="net-host" className={`mb-1 block ${appLabel}`}>
                Hostname
              </label>
              <input
                id="net-host"
                name="hostname"
                required
                maxLength={200}
                placeholder="fw-edge-01"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="net-role" className={`mb-1 block ${appLabel}`}>
                  Role
                </label>
                <input
                  id="net-role"
                  name="device_role"
                  maxLength={120}
                  placeholder="firewall"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="net-site" className={`mb-1 block ${appLabel}`}>
                  Site
                </label>
                <input
                  id="net-site"
                  name="site"
                  maxLength={120}
                  placeholder="dc-1"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="net-vendor" className={`mb-1 block ${appLabel}`}>
                  Vendor / model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="net-vendor"
                    name="vendor"
                    maxLength={120}
                    placeholder="Cisco"
                    className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                  />
                  <input
                    name="model"
                    maxLength={120}
                    placeholder="ASA-5506"
                    className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="net-fw" className={`mb-1 block ${appLabel}`}>
                  Firmware / environment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="net-fw"
                    name="firmware_version"
                    maxLength={120}
                    placeholder="9.18.4"
                    className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                  />
                  <input
                    name="environment"
                    maxLength={120}
                    placeholder="production"
                    className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="net-ip" className={`mb-1 block ${appLabel}`}>
                  Management IP
                </label>
                <input
                  id="net-ip"
                  name="mgmt_ip"
                  maxLength={100}
                  placeholder="10.0.0.1"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="net-serial" className={`mb-1 block ${appLabel}`}>
                  Serial / owner
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="net-serial"
                    name="serial_number"
                    maxLength={120}
                    placeholder="FTX..."
                    className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                  />
                  <input
                    name="owner_hint"
                    maxLength={200}
                    placeholder="NetOps"
                    className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add device
            </button>
          </form>
        </PlaceholderCard>

        <PlaceholderCard title="Device inventory">
          <h3 className={appOverline}>Tracked network devices</h3>
          {rows.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No network devices tracked"
                description="Capture baseline hardware and firmware posture to support drift and outage investigations."
                ctas={[{ href: "#net-host", label: "Add first device" }]}
              />
            </div>
          ) : (
            <ul className={`mt-3 space-y-2 ${appBody}`}>
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-foreground/90">{row.hostname}</p>
                    <p className={appMeta}>
                      {row.deviceRole ?? "role n/a"} · {row.site ?? "site n/a"} · {row.environment ?? "env n/a"}
                    </p>
                    <p className={appMeta}>Firmware: {row.firmwareVersion ?? "unknown"}</p>
                  </div>
                  <form action={deleteNetworkDeviceAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className={`font-medium text-danger hover:underline ${appMeta}`}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </PlaceholderCard>
      </div>
    </>
  );
}
