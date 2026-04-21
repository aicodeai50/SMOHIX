"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ingestAlertCreateIncident, normalizeAlertIngestPayload } from "@/lib/integrations/alert-ingest";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function generateTestIngestIncidentAction() {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/settings/connectors");
  }

  const ts = Date.now();
  const result = await ingestAlertCreateIncident(user.id, "manual-test", {
    title: "Shynvo ingest pipeline test",
    severity: "medium",
    status: "investigating",
    summary: "Synthetic event from Settings > Connectors to validate ingest flow end-to-end.",
    dedupe_key: `shynvo-test:${ts}`,
    owner_hint: "platform",
  });

  if (!result.ok) {
    redirect(`/settings/connectors?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/settings/connectors");
  revalidatePath("/incidents");
  revalidatePath("/audit");
  redirect(`/settings/connectors?ok=${encodeURIComponent(result.id)}`);
}

export async function generateVendorTestEventsAction() {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/settings/connectors");
  }

  const ts = Date.now();
  const fixtures: { source: string; payload: Record<string, unknown> }[] = [
    {
      source: "datadog",
      payload: {
        id: ts + 1,
        title: "Datadog test event",
        text: "Synthetic Datadog payload from connectors diagnostics.",
        alert_type: "error",
        tags: ["service:payments-api", "owner:platform"],
      },
    },
    {
      source: "prometheus",
      payload: {
        status: "firing",
        alerts: [
          {
            status: "firing",
            labels: { alertname: "SyntheticPrometheusAlert", severity: "critical", service: "payments-api" },
            annotations: { summary: "Synthetic Prometheus payload from connectors diagnostics." },
            fingerprint: `test-prom-${ts}`,
          },
        ],
      },
    },
    {
      source: "pagerduty",
      payload: {
        event_action: "trigger",
        dedup_key: `test-pd-${ts}`,
        payload: {
          summary: "Synthetic PagerDuty payload from connectors diagnostics.",
          source: "payments-api",
          component: "payments-api",
          severity: "critical",
        },
      },
    },
    {
      source: "newrelic",
      payload: {
        current_state: "open",
        incident_id: ts + 2,
        condition_name: "Synthetic New Relic Alert",
        policy_name: "Synthetic Policy",
        severity: "critical",
        labels: { service: "payments-api", team: "platform" },
      },
    },
  ];

  let created = 0;
  for (const f of fixtures) {
    const normalized = normalizeAlertIngestPayload(f.payload, f.source);
    const result = await ingestAlertCreateIncident(user.id, "manual-test", normalized);
    if (result.ok) {
      created += 1;
    }
  }

  revalidatePath("/settings/connectors");
  revalidatePath("/incidents");
  revalidatePath("/audit");
  redirect(`/settings/connectors?batch_ok=${created}`);
}

export async function cleanupSyntheticIngestTestsAction() {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/settings/connectors");
  }

  const { data: rows } = await supabase
    .from("incidents")
    .select("id, title, external_ref")
    .eq("user_id", user.id)
    .limit(200);

  const ids = (rows ?? []).flatMap((r) => {
    const id = typeof r.id === "string" ? r.id : "";
    const title = typeof r.title === "string" ? r.title.trim().toLowerCase() : "";
    const externalRef =
      typeof r.external_ref === "string" ? r.external_ref.trim().toLowerCase() : "";
    const isSyntheticTitle =
      title === "shynvo ingest pipeline test" ||
      title === "datadog test event" ||
      title === "syntheticprometheusalert" ||
      title === "synthetic pagerduty payload from connectors diagnostics." ||
      title === "synthetic new relic alert";
    const isSyntheticRef =
      externalRef.startsWith("prometheus:test-prom-") ||
      externalRef.startsWith("pagerduty:test-pd-") ||
      externalRef.startsWith("newrelic:");
    if (!id || (!isSyntheticTitle && !isSyntheticRef)) {
      return [];
    }
    return [id];
  });

  let deleted = 0;
  if (ids.length > 0) {
    const { error } = await supabase.from("incidents").delete().in("id", ids).eq("user_id", user.id);
    if (!error) {
      deleted = ids.length;
    }
  }

  revalidatePath("/settings/connectors");
  revalidatePath("/incidents");
  revalidatePath("/audit");
  redirect(`/settings/connectors?clean_ok=${deleted}`);
}

export async function acknowledgeUnknownSyntheticIngestAction() {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/settings/connectors");
  }

  const { data: rows } = await supabase
    .from("incidents")
    .select("id, title, status, external_ref")
    .eq("user_id", user.id)
    .limit(300);

  const ids = (rows ?? []).flatMap((r) => {
    const id = typeof r.id === "string" ? r.id : "";
    const title = typeof r.title === "string" ? r.title.trim().toLowerCase() : "";
    const status = typeof r.status === "string" ? r.status.trim().toLowerCase() : "";
    const externalRef =
      typeof r.external_ref === "string" ? r.external_ref.trim().toLowerCase() : "";
    const hasKnownPrefix =
      externalRef.startsWith("datadog:") ||
      externalRef.startsWith("prometheus:") ||
      externalRef.startsWith("pagerduty:") ||
      externalRef.startsWith("newrelic:");
    const isSyntheticTitle =
      title === "shynvo ingest pipeline test" ||
      title === "datadog test event" ||
      title === "syntheticprometheusalert" ||
      title === "synthetic pagerduty payload from connectors diagnostics." ||
      title === "synthetic new relic alert";
    const unresolved = status !== "resolved";
    const isUnknownLike = !externalRef || !hasKnownPrefix;

    if (!id || !unresolved || !isUnknownLike || !isSyntheticTitle) {
      return [];
    }
    return [id];
  });

  let updated = 0;
  if (ids.length > 0) {
    const { error } = await supabase
      .from("incidents")
      .update({ status: "mitigated" })
      .in("id", ids)
      .eq("user_id", user.id);
    if (!error) {
      updated = ids.length;
    }
  }

  revalidatePath("/settings/connectors");
  revalidatePath("/incidents");
  revalidatePath("/audit");
  redirect(`/settings/connectors?ack_ok=${updated}`);
}
